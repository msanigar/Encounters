import { mutation } from '../_generated/server'
import { v } from 'convex/values'
import { JOURNAL_EVENT_TYPES } from '../lib/constants'

export const end = mutation({
  args: {
    encounterId: v.id('encounters'),
    providerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check permissions
    const permissions = await ctx.db
      .query('permissions')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .first()

    if (!permissions?.canEnd.includes(args.providerId)) {
      throw new Error('Not authorized to end encounter')
    }

    // Update encounter status
    await ctx.db.patch(args.encounterId, {
      status: 'ended',
      endedAt: Date.now(),
    })

    // Deactivate room
    const room = await ctx.db
      .query('rooms')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .first()

    if (room) {
      await ctx.db.patch(room._id, { active: false })
    }

    // Log journal event
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: 'encounter_ended',
      payload: { providerId: args.providerId },
      at: Date.now(),
    })
  },
})

export const deleteEncounter = mutation({
  args: {
    encounterId: v.id('encounters'),
    providerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check permissions
    const permissions = await ctx.db
      .query('permissions')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .first()

    if (!permissions?.canEnd.includes(args.providerId)) {
      throw new Error('Not authorized to delete encounter')
    }

    // Delete related data
    const invites = await ctx.db
      .query('invites')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    for (const invite of invites) {
      await ctx.db.delete(invite._id)
    }

    const participants = await ctx.db
      .query('participants')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    for (const participant of participants) {
      await ctx.db.delete(participant._id)
    }

    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    for (const session of sessions) {
      await ctx.db.delete(session._id)
    }

    const journalEvents = await ctx.db
      .query('journal_events')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    for (const event of journalEvents) {
      await ctx.db.delete(event._id)
    }

    const workflows = await ctx.db
      .query('workflows')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    for (const workflow of workflows) {
      await ctx.db.delete(workflow._id)
    }

    const rooms = await ctx.db
      .query('rooms')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    for (const room of rooms) {
      await ctx.db.delete(room._id)
    }

    if (permissions) {
      await ctx.db.delete(permissions._id)
    }

    // Finally, delete the encounter
    await ctx.db.delete(args.encounterId)
  },
})
