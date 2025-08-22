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

    // Auto-assign intake form
    await ctx.db.insert('form_assignments', {
      encounterId,
      formId: 'intake',
      assignedAt: Date.now(),
      status: 'incomplete',
    })

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
