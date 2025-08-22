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
    const timeoutMs = 5 * 60 * 1000 // 5 minutes timeout

    // Filter out participants who haven't been seen recently
    const activeParticipants = participants.filter(p => {
      if (p.presence === 'offline') return false
      return (now - p.lastSeen) < timeoutMs
    })

    const onlineCount = activeParticipants.filter(p => p.presence === 'online').length
    const totalCount = participants.length

    const provider = activeParticipants.find(p => p.role === 'provider')
    const patients = activeParticipants.filter(p => p.role === 'patient')

    // Get encounter status to determine check-in state
    const encounter = await ctx.db.get(args.encounterId)
    
    // Determine check-in state
    let checkInState: 'not-arrived' | 'arrived' | 'in-call' | 'workflow' = 'not-arrived'
    
    if (encounter) {
      if (encounter.status === 'active') {
        // Check if both provider and patient are online
        const hasPatientOnline = patients.some(p => p.presence === 'online')
        const hasProviderOnline = !!provider && provider.presence === 'online'
        
        if (hasPatientOnline && hasProviderOnline) {
          checkInState = 'in-call'
        } else if (hasPatientOnline && !hasProviderOnline) {
          checkInState = 'arrived'
        } else {
          checkInState = 'workflow'
        }
      } else if (encounter.status === 'scheduled') {
        const hasPatientOnline = patients.some(p => p.presence === 'online')
        if (hasPatientOnline) {
          checkInState = 'arrived'
        }
      }
    }

    return {
      onlineCount,
      totalCount,
      provider,
      patients,
      isAlone: onlineCount === 1 && totalCount > 0,
      hasProvider: !!provider && provider.presence === 'online',
      hasPatientOnline: patients.some(p => p.presence === 'online'),
      checkInState,
      encounterStatus: encounter?.status || 'unknown',
    }
  },
})
