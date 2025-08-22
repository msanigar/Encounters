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
    
    // Get recent media events to determine if someone is actively in a call
    const recentMediaEvents = await ctx.db
      .query('journal_events')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .filter((q) => 
        q.or(
          q.eq(q.field('type'), 'MEDIA_STARTED'),
          q.eq(q.field('type'), 'MEDIA_STOPPED')
        )
      )
      .order('desc')
      .take(10) // Get last 10 media events

    // Determine if there's an active call by checking for recent MEDIA_STARTED without a following MEDIA_STOPPED
    let hasActiveCall = false
    let lastMediaStarted = 0
    let lastMediaStopped = 0

    for (const event of recentMediaEvents) {
      if (event.type === 'MEDIA_STARTED') {
        lastMediaStarted = Math.max(lastMediaStarted, event.at)
      } else if (event.type === 'MEDIA_STOPPED') {
        lastMediaStopped = Math.max(lastMediaStopped, event.at)
      }
    }

    // If the last media event was MEDIA_STARTED and it's more recent than MEDIA_STOPPED, there's an active call
    hasActiveCall = lastMediaStarted > lastMediaStopped

    // Determine check-in state with enhanced logic
    let checkInState: 'not-arrived' | 'arrived' | 'in-call' | 'dashboard' = 'not-arrived'
    
    if (encounter) {
      if (encounter.status === 'active') {
        const hasPatientOnline = patients.some(p => p.presence === 'online')
        const hasProviderOnline = !!provider && provider.presence === 'online'
        
        if (hasActiveCall && hasPatientOnline) {
          // Patient is in an active call
          checkInState = 'in-call'
        } else if (hasPatientOnline && !hasProviderOnline) {
          // Patient is online but provider hasn't joined yet
          checkInState = 'arrived'
        } else if (hasPatientOnline && hasProviderOnline && !hasActiveCall) {
          // Both are online but not in an active call (probably on dashboard)
          checkInState = 'dashboard'
        } else if (hasPatientOnline) {
          // Patient is online but no clear call state
          checkInState = 'dashboard'
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
      hasActiveCall,
      lastMediaStarted,
      lastMediaStopped,
    }
  },
})
