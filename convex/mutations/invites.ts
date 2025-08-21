import { mutation } from '../_generated/server'
import { v } from 'convex/values'
import { generateOIT, generateLiveKitRoomName, validateOIT, getRRTExpiryTime, hashRRT } from '../lib/utils'
import { JOURNAL_EVENT_TYPES } from '../lib/constants'
import { api } from '../_generated/api'

export const create = mutation({
  args: {
    providerId: v.string(),
    providerRoom: v.string(),
    scheduledAt: v.optional(v.number()),
    patientHint: v.optional(v.union(
      v.object({
        kind: v.union(v.literal('email'), v.literal('phone')),
        value: v.string(),
      }),
      v.null()
    )),
  },
  handler: async (ctx, args) => {
    // Create encounter
    const encounterId = await ctx.db.insert('encounters', {
      providerId: args.providerId,
      providerRoom: args.providerRoom,
      patientHint: args.patientHint || null,
      scheduledAt: args.scheduledAt || null,
      status: 'scheduled',
      createdAt: Date.now(),
      endedAt: null,
    })

    // Create LiveKit room
    const livekitRoom = generateLiveKitRoomName(encounterId)
    await ctx.db.insert('rooms', {
      encounterId,
      livekitRoom,
      policy: { allowAlone: true },
      active: true,
    })

    // Create permissions
    await ctx.db.insert('permissions', {
      encounterId,
      canJoin: [args.providerId, 'patient'],
      canPublish: [args.providerId],
      canEnd: [args.providerId],
    })

    // Create invite
    const oit = generateOIT()
    const inviteId = await ctx.db.insert('invites', {
      encounterId,
      channel: 'link',
      target: 'direct-link',
      oit,
      redeemedAt: null,
    })

    // Log journal event
    await ctx.db.insert('journal_events', {
      encounterId,
      type: JOURNAL_EVENT_TYPES.INVITE_CREATED,
      payload: { inviteId, oit, channel: 'link' },
      at: Date.now(),
    })

    return { encounterId, oit, inviteUrl: `/${args.providerRoom}/${oit}` }
  },
})

export const redeem = mutation({
  args: {
    providerRoom: v.string(),
    oit: v.string(),
    deviceNonce: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate OIT
    if (!validateOIT(args.oit)) {
      throw new Error('Invalid OIT')
    }

    // Find invite
    const invite = await ctx.db
      .query('invites')
      .withIndex('by_oit', (q) => q.eq('oit', args.oit))
      .first()

    if (!invite || invite.redeemedAt) {
      throw new Error('Invalid or already redeemed OIT')
    }

    // Get encounter
    const encounter = await ctx.db.get(invite.encounterId)
    if (!encounter || encounter.providerRoom !== args.providerRoom) {
      throw new Error('Invalid encounter')
    }

    // Create participant
    const participantId = `patient_${Date.now()}`
    await ctx.db.insert('participants', {
      encounterId: invite.encounterId,
      role: 'patient',
      displayName: args.displayName || 'Patient',
      presence: 'online',
      lastSeen: Date.now(),
    })

    // Create session with RRT
    const rrt = `rrt_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
    const rrtHash = hashRRT(rrt)
    const rrtExpiresAt = getRRTExpiryTime()

    await ctx.db.insert('sessions', {
      encounterId: invite.encounterId,
      participantId,
      role: 'patient',
      deviceNonce: args.deviceNonce,
      rrtHash,
      rrtExpiresAt,
      active: true,
    })

    // Mark invite as redeemed
    await ctx.db.patch(invite._id, { redeemedAt: Date.now() })

    // Get LiveKit room
    const room = await ctx.db
      .query('rooms')
      .withIndex('by_encounter', (q) => q.eq('encounterId', invite.encounterId))
      .first()

    if (!room) {
      throw new Error('Room not found')
    }

    // Note: LiveKit token will be generated on the client side

    // Log journal events
    await ctx.db.insert('journal_events', {
      encounterId: invite.encounterId,
      type: JOURNAL_EVENT_TYPES.INVITE_REDEEMED,
      payload: { inviteId: invite._id, participantId },
      at: Date.now(),
    })

    await ctx.db.insert('journal_events', {
      encounterId: invite.encounterId,
      type: JOURNAL_EVENT_TYPES.CHECKIN_OPENED,
      payload: { participantId, displayName: args.displayName },
      at: Date.now(),
    })

    return {
      encounterId: invite.encounterId,
      participantId,
      livekitRoom: room.livekitRoom,
      rrt, // This should be set as httpOnly cookie by the client
    }
  },
})
