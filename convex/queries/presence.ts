import { query } from '../_generated/server'
import { v } from 'convex/values'

export const summary = query({
  args: { encounterId: v.id('encounters') },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query('participants')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    const onlineCount = participants.filter(p => p.presence === 'online').length
    const totalCount = participants.length

    const provider = participants.find(p => p.role === 'provider')
    const patients = participants.filter(p => p.role === 'patient')

    return {
      onlineCount,
      totalCount,
      provider,
      patients,
      isAlone: onlineCount === 1 && totalCount > 0,
      hasProvider: !!provider && provider.presence === 'online',
    }
  },
})
