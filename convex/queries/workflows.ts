import { query } from '../_generated/server'
import { v } from 'convex/values'

export const get = query({
  args: { encounterId: v.id('encounters') },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query('workflows')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .first()

    return workflow || { state: 'none', items: [] }
  },
})
