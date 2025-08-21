import { mutation } from '../_generated/server'

export const clearAllInvites = mutation({
  args: {},
  handler: async (ctx) => {
    const invites = await ctx.db.query('invites').collect()
    for (const invite of invites) {
      await ctx.db.delete(invite._id)
    }
    console.log(`🗑️ Deleted ${invites.length} invites`)
  },
})

export const clearAllEncounters = mutation({
  args: {},
  handler: async (ctx) => {
    const encounters = await ctx.db.query('encounters').collect()
    for (const encounter of encounters) {
      await ctx.db.delete(encounter._id)
    }
    console.log(`🗑️ Deleted ${encounters.length} encounters`)
  },
})

export const clearAllParticipants = mutation({
  args: {},
  handler: async (ctx) => {
    const participants = await ctx.db.query('participants').collect()
    for (const participant of participants) {
      await ctx.db.delete(participant._id)
    }
    console.log(`🗑️ Deleted ${participants.length} participants`)
  },
})

export const clearAllSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query('sessions').collect()
    for (const session of sessions) {
      await ctx.db.delete(session._id)
    }
    console.log(`🗑️ Deleted ${sessions.length} sessions`)
  },
})

export const clearAllRooms = mutation({
  args: {},
  handler: async (ctx) => {
    const rooms = await ctx.db.query('rooms').collect()
    for (const room of rooms) {
      await ctx.db.delete(room._id)
    }
    console.log(`🗑️ Deleted ${rooms.length} rooms`)
  },
})

export const clearAllJournalEvents = mutation({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query('journal_events').collect()
    for (const event of events) {
      await ctx.db.delete(event._id)
    }
    console.log(`🗑️ Deleted ${events.length} journal events`)
  },
})

export const clearAllWorkflows = mutation({
  args: {},
  handler: async (ctx) => {
    const workflows = await ctx.db.query('workflows').collect()
    for (const workflow of workflows) {
      await ctx.db.delete(workflow._id)
    }
    console.log(`🗑️ Deleted ${workflows.length} workflows`)
  },
})

export const clearAllPermissions = mutation({
  args: {},
  handler: async (ctx) => {
    const permissions = await ctx.db.query('permissions').collect()
    for (const permission of permissions) {
      await ctx.db.delete(permission._id)
    }
    console.log(`🗑️ Deleted ${permissions.length} permissions`)
  },
})
