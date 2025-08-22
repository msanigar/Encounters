import { mutation } from '../_generated/server'
import { v } from 'convex/values'
import { JOURNAL_EVENT_TYPES } from '../lib/constants'

export const end = mutation({
  args: {
    encounterId: v.id('encounters'),
    providerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check permissions
    const permissions = await ctx.db
      .query('permissions')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .first()

    if (!permissions?.canEnd.includes(args.providerId)) {
      throw new Error('Not authorized to end encounter')
    }

    // Update encounter status
    await ctx.db.patch(args.encounterId, {
      status: 'ended',
      endedAt: Date.now(),
    })

    // Deactivate room
    const room = await ctx.db
      .query('rooms')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .first()

    if (room) {
      await ctx.db.patch(room._id, { active: false })
    }

    // Log journal event
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: 'encounter_ended',
      payload: { providerId: args.providerId },
      at: Date.now(),
    })
  },
})

export const deleteEncounter = mutation({
  args: {
    encounterId: v.id('encounters'),
    providerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check permissions
    const permissions = await ctx.db
      .query('permissions')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .first()

    if (!permissions?.canEnd.includes(args.providerId)) {
      throw new Error('Not authorized to delete encounter')
    }

    // Delete related data
    const invites = await ctx.db
      .query('invites')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    for (const invite of invites) {
      await ctx.db.delete(invite._id)
    }

    const participants = await ctx.db
      .query('participants')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    for (const participant of participants) {
      await ctx.db.delete(participant._id)
    }

    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    for (const session of sessions) {
      await ctx.db.delete(session._id)
    }

    const journalEvents = await ctx.db
      .query('journal_events')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    for (const event of journalEvents) {
      await ctx.db.delete(event._id)
    }

    const workflows = await ctx.db
      .query('workflows')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    for (const workflow of workflows) {
      await ctx.db.delete(workflow._id)
    }

    const rooms = await ctx.db
      .query('rooms')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()

    for (const room of rooms) {
      await ctx.db.delete(room._id)
    }

    if (permissions) {
      await ctx.db.delete(permissions._id)
    }

    // Finally, delete the encounter
    await ctx.db.delete(args.encounterId)
  },
})

export const tidyStale = mutation({
  args: {
    now: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = args.now || Date.now()
    const staleThreshold = 5 * 60 * 1000 // 5 minutes
    const oldScheduledThreshold = 30 * 60 * 1000 // 30 minutes for old scheduled encounters
    
    console.log('🧹 Starting auto-tidy of stale encounters...')
    
    let tidiedCount = 0
    
    // 1. Clean up active encounters with stale presence
    const activeEncounters = await ctx.db
      .query('encounters')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect()
    
    for (const encounter of activeEncounters) {
      // Get patient participants for this encounter
      const patientParticipants = await ctx.db
        .query('participants')
        .withIndex('by_encounter', (q) => q.eq('encounterId', encounter._id))
        .filter((q) => q.eq(q.field('role'), 'patient'))
        .collect()
      
      // Check if any patient is still online
      const hasPatientOnline = patientParticipants.some(p => {
        if (p.presence === 'offline') return false
        return (now - p.lastSeen) < staleThreshold
      })
      
      // Get provider participants
      const providerParticipants = await ctx.db
        .query('participants')
        .withIndex('by_encounter', (q) => q.eq('encounterId', encounter._id))
        .filter((q) => q.eq(q.field('role'), 'provider'))
        .collect()
      
      // Check if provider is in-call (online and recently seen)
      const hasProviderInCall = providerParticipants.some(p => {
        if (p.presence === 'offline') return false
        return (now - p.lastSeen) < staleThreshold
      })
      
      // If no patient online and provider not in-call, mark as ended
      if (!hasPatientOnline && !hasProviderInCall) {
        await ctx.db.patch(encounter._id, {
          status: 'ended',
          endedAt: now,
        })
        
        // Log the auto-ending
        await ctx.db.insert('journal_events', {
          encounterId: encounter._id,
          type: 'ENCOUNTER_AUTO_ENDED',
          payload: {
            reason: 'stale_presence',
            autoEndedAt: now,
            patientParticipants: patientParticipants.length,
            providerParticipants: providerParticipants.length,
          },
          at: now,
        })
        
        tidiedCount++
        console.log(`✅ Auto-ended active encounter ${encounter._id} due to stale presence`)
      }
    }
    
    // 2. Clean up old scheduled encounters that have been sitting too long
    const scheduledEncounters = await ctx.db
      .query('encounters')
      .withIndex('by_status', (q) => q.eq('status', 'scheduled'))
      .collect()
    
    for (const encounter of scheduledEncounters) {
      // Check if this scheduled encounter is old (created more than 30 minutes ago)
      const encounterAge = now - encounter.createdAt
      
      if (encounterAge > oldScheduledThreshold) {
        // Get participants to check if anyone is actually online
        const participants = await ctx.db
          .query('participants')
          .withIndex('by_encounter', (q) => q.eq('encounterId', encounter._id))
          .collect()
        
        // Check if any participant is online
        const hasAnyoneOnline = participants.some(p => {
          if (p.presence === 'offline') return false
          return (now - p.lastSeen) < staleThreshold
        })
        
        // If no one is online and encounter is old, mark as ended
        if (!hasAnyoneOnline) {
          await ctx.db.patch(encounter._id, {
            status: 'ended',
            endedAt: now,
          })
          
          // Log the auto-ending
          await ctx.db.insert('journal_events', {
            encounterId: encounter._id,
            type: 'ENCOUNTER_AUTO_ENDED',
            payload: {
              reason: 'old_scheduled_no_presence',
              autoEndedAt: now,
              encounterAge: encounterAge,
              participants: participants.length,
            },
            at: now,
          })
          
          tidiedCount++
          console.log(`✅ Auto-ended old scheduled encounter ${encounter._id} (age: ${Math.round(encounterAge / 60000)}min)`)
        }
      }
    }
    
    console.log(`🧹 Auto-tidy complete: ${tidiedCount} encounters ended`)
    return { tidiedCount }
  },
})

export const forceCleanupOldEncounters = mutation({
  args: {
    olderThanHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const hoursThreshold = (args.olderThanHours || 1) * 60 * 60 * 1000 // Default 1 hour
    
    console.log(`🧹 Force cleaning up encounters older than ${args.olderThanHours || 1} hour(s)...`)
    
    // Get all encounters
    const allEncounters = await ctx.db.query('encounters').collect()
    
    let cleanedCount = 0
    
    for (const encounter of allEncounters) {
      const encounterAge = now - encounter.createdAt
      
      if (encounterAge > hoursThreshold) {
        // Mark as ended
        await ctx.db.patch(encounter._id, {
          status: 'ended',
          endedAt: now,
        })
        
        // Log the cleanup
        await ctx.db.insert('journal_events', {
          encounterId: encounter._id,
          type: 'ENCOUNTER_FORCE_CLEANED',
          payload: {
            reason: 'manual_cleanup_old_encounter',
            cleanedAt: now,
            encounterAge: encounterAge,
            originalStatus: encounter.status,
            ageInHours: Math.round(encounterAge / (60 * 60 * 1000)),
          },
          at: now,
        })
        
        cleanedCount++
        console.log(`✅ Force cleaned old encounter ${encounter._id} (age: ${Math.round(encounterAge / (60 * 60 * 1000))}h, was: ${encounter.status})`)
      }
    }
    
    console.log(`🧹 Force cleanup complete: ${cleanedCount} encounters cleaned`)
    return { cleanedCount }
  },
})
