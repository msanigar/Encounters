import { mutation } from '../_generated/server'
import { v } from 'convex/values'

export const resetOits = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('🧹 Starting OIT reset...')

    try {
      // Clear all data
      console.log('🗑️ Clearing all data...')
      
      // Clear invites
      const invites = await ctx.db.query('invites').collect()
      for (const invite of invites) {
        await ctx.db.delete(invite._id)
      }
      
      // Clear encounters
      const encounters = await ctx.db.query('encounters').collect()
      for (const encounter of encounters) {
        await ctx.db.delete(encounter._id)
      }
      
      // Clear participants
      const participants = await ctx.db.query('participants').collect()
      for (const participant of participants) {
        await ctx.db.delete(participant._id)
      }
      
      // Clear sessions
      const sessions = await ctx.db.query('sessions').collect()
      for (const session of sessions) {
        await ctx.db.delete(session._id)
      }
      
      // Clear rooms
      const rooms = await ctx.db.query('rooms').collect()
      for (const room of rooms) {
        await ctx.db.delete(room._id)
      }
      
      // Clear journal events
      const events = await ctx.db.query('journal_events').collect()
      for (const event of events) {
        await ctx.db.delete(event._id)
      }
      
      // Clear workflows
      const workflows = await ctx.db.query('workflows').collect()
      for (const workflow of workflows) {
        await ctx.db.delete(workflow._id)
      }
      
      // Clear permissions
      const permissions = await ctx.db.query('permissions').collect()
      for (const permission of permissions) {
        await ctx.db.delete(permission._id)
      }

      // Create new sample encounters
      console.log('🌱 Creating new sample encounters...')
      const newEncounters = [
        {
          providerId: 'provider-demo-001',
          providerRoom: 'demo-room',
          patientHint: { kind: 'email' as const, value: 'john.doe@example.com' },
          scheduledAt: Date.now() + 5 * 60 * 1000, // 5 minutes from now
        },
        {
          providerId: 'provider-demo-001',
          providerRoom: 'demo-room',
          patientHint: { kind: 'email' as const, value: 'jane.smith@example.com' },
          scheduledAt: Date.now(), // Now
        },
        {
          providerId: 'provider-demo-001',
          providerRoom: 'demo-room',
          patientHint: { kind: 'email' as const, value: 'bob.wilson@example.com' },
          scheduledAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
        },
      ]

      const createdEncounters = []

      for (const encounterData of newEncounters) {
        // Create encounter
        const encounterId = await ctx.db.insert('encounters', {
          providerId: encounterData.providerId,
          providerRoom: encounterData.providerRoom,
          patientHint: encounterData.patientHint,
          scheduledAt: encounterData.scheduledAt,
          status: 'scheduled',
          createdAt: Date.now(),
          endedAt: null,
        })

        // Create invite
        const oit = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        const inviteId = await ctx.db.insert('invites', {
          encounterId,
          oit,
          channel: 'link',
          target: encounterData.patientHint.value,
          redeemedAt: null,
        })

        createdEncounters.push({
          encounterId,
          inviteId,
          oit,
          inviteUrl: `/${encounterData.providerRoom}/${oit}`,
          patientEmail: encounterData.patientHint.value
        })
        
        console.log(`✅ Created encounter: ${encounterData.patientHint.value}`)
      }

      console.log('✅ OIT reset complete!')
      
      return {
        success: true,
        message: 'OITs reset successfully',
        encounters: createdEncounters
      }
    } catch (error) {
      console.error('❌ OIT reset failed:', error)
      throw new Error(`Failed to reset OITs: ${error}`)
    }
  },
})
