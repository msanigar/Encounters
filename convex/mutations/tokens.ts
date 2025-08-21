import { mutation } from '../_generated/server'
import { v } from 'convex/values'
import { isRRTExpired, getRRTExpiryTime, hashRRT } from '../lib/utils'
import { JOURNAL_EVENT_TYPES } from '../lib/constants'

export const refresh = mutation({
  args: {
    encounterId: v.id('encounters'),
    deviceNonce: v.string(),
    rrt: v.string(),
  },
  handler: async (ctx, args) => {
    // Find active session
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .filter((q) => 
        q.and(
          q.eq(q.field('deviceNonce'), args.deviceNonce),
          q.eq(q.field('active'), true)
        )
      )
      .first()

    if (!session) {
      throw new Error('No active session found')
    }

    // Validate RRT
    const rrtHash = hashRRT(args.rrt)
    if (session.rrtHash !== rrtHash) {
      throw new Error('Invalid RRT')
    }

    if (isRRTExpired(session.rrtExpiresAt)) {
      // Deactivate session
      await ctx.db.patch(session._id, { active: false })
      
      // Log failed reconnect
      await ctx.db.insert('journal_events', {
        encounterId: args.encounterId,
        type: JOURNAL_EVENT_TYPES.RECONNECT_FAILED,
        payload: { participantId: session.participantId, reason: 'RRT expired' },
        at: Date.now(),
      })
      
      throw new Error('RRT expired')
    }

    // Get room
    const room = await ctx.db
      .query('rooms')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .first()

    if (!room) {
      throw new Error('Room not found')
    }

    // Note: LiveKit token will be generated on the client side

    // Refresh RRT expiry
    const newRrtExpiresAt = getRRTExpiryTime()
    await ctx.db.patch(session._id, { rrtExpiresAt: newRrtExpiresAt })

    // Log successful reconnect
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: JOURNAL_EVENT_TYPES.RECONNECT_SUCCESS,
      payload: { participantId: session.participantId },
      at: Date.now(),
    })

    return {
      livekitRoom: room.livekitRoom,
      participantId: session.participantId,
      rrtExpiresAt: newRrtExpiresAt,
    }
  },
})
