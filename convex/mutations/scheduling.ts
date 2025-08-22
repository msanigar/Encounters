import { mutation } from '../_generated/server'
import { v } from 'convex/values'
import { generateOIT, generateLiveKitRoomName } from '../lib/utils'
import { api } from '../_generated/api'

export const createEncounterWithInvite = mutation({
  args: {
    providerId: v.string(),
    providerRoom: v.string(),
    when: v.number(), // timestamp
    patientId: v.optional(v.id('patients')),
    patientProps: v.optional(v.object({
      displayName: v.string(),
      emailOrPhone: v.string(),
    })),
    channel: v.union(v.literal('email'), v.literal('sms'), v.literal('link')),
  },
  handler: async (ctx, args) => {
    let patientId = args.patientId

    // If no patientId provided, upsert by contact info
    if (!patientId && args.patientProps) {
      // Check if patient already exists
      const existingPatient = await ctx.db
        .query('patients')
        .withIndex('by_contact', (q) => q.eq('emailOrPhone', args.patientProps!.emailOrPhone))
        .first()

      if (existingPatient) {
        patientId = existingPatient._id
        // Update display name if provided and different
        if (args.patientProps.displayName && args.patientProps.displayName !== existingPatient.displayName) {
          await ctx.db.patch(existingPatient._id, {
            displayName: args.patientProps.displayName,
          })
        }
      } else {
        // Create new patient
        patientId = await ctx.db.insert('patients', {
          displayName: args.patientProps.displayName,
          emailOrPhone: args.patientProps.emailOrPhone,
          createdAt: Date.now(),
        })
      }
    }

    if (!patientId) {
      throw new Error('Patient ID or patient properties must be provided')
    }

    // Create encounter
    const encounterId = await ctx.db.insert('encounters', {
      providerId: args.providerId,
      providerRoom: args.providerRoom,
      patientHint: args.patientProps ? {
        kind: args.patientProps.emailOrPhone.includes('@') ? 'email' : 'phone',
        value: args.patientProps.emailOrPhone,
      } : null,
      scheduledAt: args.when,
      status: 'scheduled',
      createdAt: Date.now(),
      endedAt: null,
    })

    // Create LiveKit room
    const livekitRoom = generateLiveKitRoomName(encounterId)
    const roomId = await ctx.db.insert('rooms', {
      encounterId,
      livekitRoom,
      policy: {
        allowAlone: true,
      },
      active: true,
    })

    // Create invite with OIT
    const oit = generateOIT()
    const inviteId = await ctx.db.insert('invites', {
      encounterId,
      oit,
      channel: args.channel,
      target: args.patientProps?.emailOrPhone || '',
      redeemedAt: null,
    })

    // Link patient to encounter
    await ctx.db.insert('patient_links', {
      patientId,
      encounterId,
      createdAt: Date.now(),
    })

    // Create permissions
    await ctx.db.insert('permissions', {
      encounterId,
      canJoin: [args.providerId],
      canPublish: [args.providerId],
      canEnd: [args.providerId],
    })

    // Note: Forms are now manually assigned by providers, not auto-assigned

    // Emit journal events
    await ctx.db.insert('journal_events', {
      encounterId,
      type: 'INVITE_CREATED',
      payload: {
        channel: args.channel,
        target: args.patientProps?.emailOrPhone || '',
        oit,
        scheduledAt: args.when,
      },
      at: Date.now(),
    })

    const patient = await ctx.db.get(patientId)
    if (patient) {
      await ctx.db.insert('journal_events', {
        encounterId,
        type: 'NOTE_ADDED',
        payload: {
          message: `Encounter scheduled for ${patient.displayName}`,
          patientId,
          scheduledAt: args.when,
        },
        at: Date.now(),
      })
    }

    const inviteUrl = `/${args.providerRoom}/${oit}`

    // Schedule email if channel is email
    if (args.channel === 'email' && args.patientProps?.emailOrPhone) {
      // Schedule email to be sent asynchronously
      await ctx.scheduler.runAfter(0, api.actions.email.sendInviteEmail, {
        to: args.patientProps.emailOrPhone,
        providerName: 'Dr. Provider', // TODO: Get actual provider name
        when: args.when,
        inviteUrl: `${process.env.SITE_URL || 'http://localhost:3000'}${inviteUrl}`,
      })

      // Log that email was scheduled
      await ctx.db.insert('journal_events', {
        encounterId,
        type: 'INVITE_EMAIL_SCHEDULED',
        payload: {
          to: args.patientProps.emailOrPhone,
          scheduledAt: Date.now(),
        },
        at: Date.now(),
      })
    }

    return {
      encounterId,
      inviteId,
      roomId,
      oit,
      livekitRoom,
      inviteUrl,
      patient,
    }
  },
})

export const rescheduleEncounter = mutation({
  args: {
    encounterId: v.id('encounters'),
    newScheduledAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Update the encounter's scheduled time
    await ctx.db.patch(args.encounterId, {
      scheduledAt: args.newScheduledAt,
    })

    // Log the rescheduling to journal
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: 'ENCOUNTER_RESCHEDULED',
      payload: {
        newScheduledAt: args.newScheduledAt,
        rescheduledAt: Date.now(),
      },
      at: Date.now(),
    })

    return args.encounterId
  },
})

export const deleteEncounter = mutation({
  args: {
    encounterId: v.id('encounters'),
  },
  handler: async (ctx, args) => {
    // Get the encounter to check if it can be deleted
    const encounter = await ctx.db.get(args.encounterId)
    if (!encounter) {
      throw new Error('Encounter not found')
    }

    // Only allow deletion of scheduled encounters (not active ones)
    if (encounter.status === 'active') {
      throw new Error('Cannot delete an active encounter')
    }

    // Log the cancellation to journal before deleting
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: 'ENCOUNTER_CANCELLED',
      payload: {
        cancelledAt: Date.now(),
        originalScheduledAt: encounter.scheduledAt,
        patientHint: encounter.patientHint,
      },
      at: Date.now(),
    })

    // Delete related records
    // Delete invites
    const invites = await ctx.db
      .query('invites')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()
    
    for (const invite of invites) {
      await ctx.db.delete(invite._id)
    }

    // Delete rooms
    const rooms = await ctx.db
      .query('rooms')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()
    
    for (const room of rooms) {
      await ctx.db.delete(room._id)
    }

    // Delete permissions
    const permissions = await ctx.db
      .query('permissions')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()
    
    for (const permission of permissions) {
      await ctx.db.delete(permission._id)
    }

    // Delete patient links
    const patientLinks = await ctx.db
      .query('patient_links')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()
    
    for (const link of patientLinks) {
      await ctx.db.delete(link._id)
    }

    // Delete form assignments
    const formAssignments = await ctx.db
      .query('form_assignments')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()
    
    for (const assignment of formAssignments) {
      await ctx.db.delete(assignment._id)
    }

    // Delete participants
    const participants = await ctx.db
      .query('participants')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()
    
    for (const participant of participants) {
      await ctx.db.delete(participant._id)
    }

    // Delete journal events
    const journalEvents = await ctx.db
      .query('journal_events')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()
    
    for (const event of journalEvents) {
      await ctx.db.delete(event._id)
    }

    // Delete workflows
    const workflows = await ctx.db
      .query('workflows')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()
    
    for (const workflow of workflows) {
      await ctx.db.delete(workflow._id)
    }

    // Delete notes
    const notes = await ctx.db
      .query('notes')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()
    
    for (const note of notes) {
      await ctx.db.delete(note._id)
    }

    // Finally, delete the encounter itself
    await ctx.db.delete(args.encounterId)

    return { success: true }
  },
})
