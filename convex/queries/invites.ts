import { query } from '../_generated/server'
import { v } from 'convex/values'

export const getForEncounter = query({
  args: {
    encounterId: v.id('encounters'),
  },
  handler: async (ctx, args) => {
    const invites = await ctx.db
      .query('invites')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    return invites
  },
})

export const getByOIT = query({
  args: {
    oit: v.string(),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query('invites')
      .withIndex('by_oit', (q) => q.eq('oit', args.oit))
      .first()

    return invite
  },
})
