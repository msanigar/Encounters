import { mutation } from '../_generated/server'
import { v } from 'convex/values'
import { JOURNAL_EVENT_TYPES } from '../lib/constants'

export const join = mutation({
  args: {
    encounterId: v.id('encounters'),
    providerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Update encounter status
    await ctx.db.patch(args.encounterId, { status: 'active' })

    // Update or create provider participant
    const existingParticipant = await ctx.db
      .query('participants')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .filter((q) => q.eq(q.field('role'), 'provider'))
      .first()

    if (existingParticipant) {
      await ctx.db.patch(existingParticipant._id, {
        presence: 'online',
        lastSeen: Date.now(),
      })
    } else {
      await ctx.db.insert('participants', {
        encounterId: args.encounterId,
        role: 'provider',
        displayName: 'Dr. Provider',
        presence: 'online',
        lastSeen: Date.now(),
      })
    }

    // Update permissions to allow provider to publish
    const permissions = await ctx.db
      .query('permissions')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .first()

    if (permissions) {
      const canPublish = Array.from(new Set([...permissions.canPublish, args.providerId]))
      await ctx.db.patch(permissions._id, { canPublish })
    }

    // Log journal events
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: JOURNAL_EVENT_TYPES.PROVIDER_JOINED,
      payload: { providerId: args.providerId },
      at: Date.now(),
    })

    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: JOURNAL_EVENT_TYPES.MEDIA_STARTED,
      payload: { providerId: args.providerId },
      at: Date.now(),
    })

    return { success: true }
  },
})

export const leave = mutation({
  args: {
    encounterId: v.id('encounters'),
    providerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Update encounter status to paused
    await ctx.db.patch(args.encounterId, { status: 'paused' })

    // Update provider participant presence
    const participant = await ctx.db
      .query('participants')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .filter((q) => q.eq(q.field('role'), 'provider'))
      .first()

    if (participant) {
      await ctx.db.patch(participant._id, {
        presence: 'offline',
        lastSeen: Date.now(),
      })
    }

    // Remove provider from publish permissions
    const permissions = await ctx.db
      .query('permissions')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .first()

    if (permissions) {
      const canPublish = permissions.canPublish.filter(id => id !== args.providerId)
      await ctx.db.patch(permissions._id, { canPublish })
    }

    // Log journal events
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: JOURNAL_EVENT_TYPES.MEDIA_STOPPED,
      payload: { providerId: args.providerId },
      at: Date.now(),
    })

    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: JOURNAL_EVENT_TYPES.PROVIDER_LEFT,
      payload: { providerId: args.providerId },
      at: Date.now(),
    })

    return { success: true }
  },
})
