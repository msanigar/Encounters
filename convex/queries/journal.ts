import { query } from '../_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: { 
    encounterId: v.id('encounters'),
    filter: v.optional(v.union(
      v.literal('all'),
      v.literal('system'),
      v.literal('chat'),
      v.literal('forms')
    ))
  },
  handler: async (ctx, args) => {
    let events = await ctx.db
      .query('journal_events')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .order('desc')
      .collect()

    // Apply filters
    if (args.filter && args.filter !== 'all') {
      events = events.filter(event => {
        switch (args.filter) {
          case 'system':
            return !['CHAT_MESSAGE', 'FORM_ASSIGNED', 'FORM_SUBMITTED'].includes(event.type)
          case 'chat':
            return event.type === 'CHAT_MESSAGE'
          case 'forms':
            return ['FORM_ASSIGNED', 'FORM_SUBMITTED'].includes(event.type)
          default:
            return true
        }
      })
    }

    return events
  },
})

export const getRecent = query({
  args: { 
    encounterId: v.id('encounters'),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query('journal_events')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .order('desc')
      .take(args.limit || 50)

    return events
  },
})
