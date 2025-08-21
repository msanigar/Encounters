import { mutation } from '../_generated/server'
import { v } from 'convex/values'
import { JOURNAL_EVENT_TYPES } from '../lib/constants'

export const postMessage = mutation({
  args: {
    encounterId: v.id('encounters'),
    text: v.string(),
    participantId: v.string(),
  },
  handler: async (ctx, args) => {
    // Log chat message
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: JOURNAL_EVENT_TYPES.CHAT_MESSAGE,
      payload: {
        text: args.text,
        participantId: args.participantId,
        timestamp: Date.now(),
      },
      at: Date.now(),
    })

    return { success: true }
  },
})
