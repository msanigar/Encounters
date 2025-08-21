import { query } from '../_generated/server'
import { v } from 'convex/values'

export const listForProvider = query({
  args: {
    providerId: v.string(),
  },
  handler: async (ctx, args) => {
    const encounters = await ctx.db
      .query('encounters')
      .withIndex('by_provider', (q) => q.eq('providerId', args.providerId))
      .order('desc')
      .collect()

    return encounters
  },
})

export const get = query({
  args: {
    encounterId: v.id('encounters'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.encounterId)
  },
})

export const getWithDetails = query({
  args: {
    encounterId: v.id('encounters'),
  },
  handler: async (ctx, args) => {
    const encounter = await ctx.db.get(args.encounterId)
    if (!encounter) return null

    const room = await ctx.db
      .query('rooms')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .first()

    const invites = await ctx.db
      .query('invites')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    return {
      ...encounter,
      room,
      invites,
    }
  },
})

export const listForProviderWithInvites = query({
  args: {
    providerId: v.string(),
  },
  handler: async (ctx, args) => {
    const encounters = await ctx.db
      .query('encounters')
      .withIndex('by_provider', (q) => q.eq('providerId', args.providerId))
      .order('desc')
      .collect()

    // Get invites for each encounter
    const encountersWithInvites = await Promise.all(
      encounters.map(async (encounter) => {
        const invites = await ctx.db
          .query('invites')
          .withIndex('by_encounter', (q) => q.eq('encounterId', encounter._id))
          .collect()
        
        return {
          ...encounter,
          invites,
        }
      })
    )

    return encountersWithInvites
  },
})
