import { query } from '../_generated/server'
import { v } from 'convex/values'

export const getQueue = query({
  args: { providerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('preencounter_visits')
      .withIndex('by_provider', (q) => q.eq('providerId', args.providerId))
      .filter((q) => q.eq(q.field('status'), 'waiting'))
      .order('asc') // Order by queue position
      .collect()
  },
})

export const getVisit = query({
  args: { visitId: v.id('preencounter_visits') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.visitId)
  },
})

export const getQueueStats = query({
  args: { providerId: v.string() },
  handler: async (ctx, args) => {
    const waiting = await ctx.db
      .query('preencounter_visits')
      .withIndex('by_provider', (q) => q.eq('providerId', args.providerId))
      .filter((q) => q.eq(q.field('status'), 'waiting'))
      .collect()

    const inProgress = await ctx.db
      .query('preencounter_visits')
      .withIndex('by_provider', (q) => q.eq('providerId', args.providerId))
      .filter((q) => q.eq(q.field('status'), 'in-progress'))
      .collect()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.getTime()

    const todayCompleted = await ctx.db
      .query('preencounter_visits')
      .withIndex('by_provider', (q) => q.eq('providerId', args.providerId))
      .filter((q) => 
        q.and(
          q.eq(q.field('status'), 'completed'),
          q.gte(q.field('checkedInAt'), todayStart)
        )
      )
      .collect()

    return {
      waiting: waiting.length,
      inProgress: inProgress.length,
      completedToday: todayCompleted.length,
      averageWaitTime: waiting.length > 0 
        ? waiting.reduce((sum, visit) => sum + (visit.estimatedWaitTime || 0), 0) / waiting.length
        : 0,
    }
  },
})
