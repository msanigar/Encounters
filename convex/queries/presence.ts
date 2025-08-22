import { query } from '../_generated/server'
import { v } from 'convex/values'

export const summary = query({
  args: { encounterId: v.id('encounters') },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query('participants')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    const now = Date.now()
    const timeoutMs = 2 * 60 * 1000 // 2 minutes timeout

    // Filter out participants who haven't been seen recently
    const activeParticipants = participants.filter(p => {
      if (p.presence === 'offline') return false
      return (now - p.lastSeen) < timeoutMs
    })

    const onlineCount = activeParticipants.filter(p => p.presence === 'online').length
    const totalCount = participants.length

    const provider = activeParticipants.find(p => p.role === 'provider')
    const patients = activeParticipants.filter(p => p.role === 'patient')

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
