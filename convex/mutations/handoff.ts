import { mutation } from '../_generated/server'
import { v } from 'convex/values'
import { generateHOT, getRRTExpiryTime, hashRRT } from '../lib/utils'
import { JOURNAL_EVENT_TYPES } from '../lib/constants'

export const issue = mutation({
  args: {
    encounterId: v.id('encounters'),
  },
  handler: async (ctx, args) => {
    const hot = generateHOT()
    
    // Log journal event
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: JOURNAL_EVENT_TYPES.HANDOFF_ISSUED,
      payload: { hot },
      at: Date.now(),
    })

    return { hot, handoffUrl: `/handoff/${args.encounterId}/${hot}` }
  },
})

export const redeem = mutation({
  args: {
    encounterId: v.id('encounters'),
    hot: v.string(),
    deviceNonce: v.string(),
    requireApproval: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if approval is required (default: true)
    const needsApproval = args.requireApproval !== false

    if (needsApproval) {
      // Log attempt for provider approval
      await ctx.db.insert('journal_events', {
        encounterId: args.encounterId,
        type: JOURNAL_EVENT_TYPES.SECOND_DEVICE_ATTEMPT,
        payload: { hot: args.hot, deviceNonce: args.deviceNonce },
        at: Date.now(),
      })

      return { requiresApproval: true }
    }

    // Deactivate old sessions for this encounter
    const oldSessions = await ctx.db
      .query('sessions')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .filter((q) => q.eq(q.field('active'), true))
      .collect()

    for (const session of oldSessions) {
      await ctx.db.patch(session._id, { active: false })
    }

    // Create new session with RRT
    const rrt = `rrt_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
    const rrtHash = hashRRT(rrt)
    const rrtExpiresAt = getRRTExpiryTime()

    const participantId = `patient_${Date.now()}`
    await ctx.db.insert('sessions', {
      encounterId: args.encounterId,
      participantId,
      role: 'patient',
      deviceNonce: args.deviceNonce,
      rrtHash,
      rrtExpiresAt,
      active: true,
    })

    // Log successful handoff
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: JOURNAL_EVENT_TYPES.HANDOFF_REDEEMED,
      payload: { hot: args.hot, participantId, deviceNonce: args.deviceNonce },
      at: Date.now(),
    })

    return {
      requiresApproval: false,
      participantId,
      rrt,
      rrtExpiresAt,
    }
  },
})
