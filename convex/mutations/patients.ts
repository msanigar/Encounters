import { mutation } from '../_generated/server'
import { v } from 'convex/values'
import { JOURNAL_EVENT_TYPES } from '../lib/constants'

export const create = mutation({
  args: {
    displayName: v.string(),
    emailOrPhone: v.string(),
  },
  handler: async (ctx, args) => {
    const patientId = await ctx.db.insert('patients', {
      displayName: args.displayName,
      emailOrPhone: args.emailOrPhone,
      createdAt: Date.now(),
    })

    // Emit journal event for patient creation
    await ctx.db.insert('journal_events', {
      encounterId: null,
      type: JOURNAL_EVENT_TYPES.NOTE_ADDED,
      payload: {
        message: 'Patient record created',
        patientId,
        displayName: args.displayName,
        emailOrPhone: args.emailOrPhone,
      },
      at: Date.now(),
    })

    return patientId
  },
})

export const upsertByContact = mutation({
  args: {
    displayName: v.optional(v.string()),
    emailOrPhone: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if patient already exists
    const existingPatient = await ctx.db
      .query('patients')
      .withIndex('by_contact', (q) => q.eq('emailOrPhone', args.emailOrPhone))
      .first()

    if (existingPatient) {
      // Update display name if provided and different
      if (args.displayName && args.displayName !== existingPatient.displayName) {
        await ctx.db.patch(existingPatient._id, {
          displayName: args.displayName,
        })
      }
      return existingPatient._id
    }

    // Create new patient if doesn't exist
    const patientId = await ctx.db.insert('patients', {
      displayName: args.displayName || 'Unknown Patient',
      emailOrPhone: args.emailOrPhone,
      createdAt: Date.now(),
    })

    // Emit journal event for patient creation
    await ctx.db.insert('journal_events', {
      encounterId: null,
      type: 'NOTE_ADDED',
      payload: {
        message: 'Patient record created',
        patientId,
        displayName: args.displayName || 'Unknown Patient',
        emailOrPhone: args.emailOrPhone,
      },
      at: Date.now(),
    })

    return patientId
  },
})

export const update = mutation({
  args: {
    patientId: v.id('patients'),
    displayName: v.optional(v.string()),
    emailOrPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId)
    if (!patient) {
      throw new Error('Patient not found')
    }

    // Check if email/phone is being changed and if it conflicts with existing patient
    if (args.emailOrPhone && args.emailOrPhone !== patient.emailOrPhone) {
      const existingPatient = await ctx.db
        .query('patients')
        .withIndex('by_contact', (q) => q.eq('emailOrPhone', args.emailOrPhone!))
        .first()

      if (existingPatient && existingPatient._id !== args.patientId) {
        throw new Error('A patient with this email/phone already exists')
      }
    }

    // Update patient data
    const updateData: any = {}
    if (args.displayName !== undefined) updateData.displayName = args.displayName
    if (args.emailOrPhone !== undefined) updateData.emailOrPhone = args.emailOrPhone

    await ctx.db.patch(args.patientId, updateData)

    // Emit journal event for patient update
    await ctx.db.insert('journal_events', {
      encounterId: null,
      type: JOURNAL_EVENT_TYPES.NOTE_ADDED,
      payload: {
        message: 'Patient record updated',
        patientId: args.patientId,
        displayName: args.displayName || patient.displayName,
        emailOrPhone: args.emailOrPhone || patient.emailOrPhone,
        updatedFields: Object.keys(updateData),
      },
      at: Date.now(),
    })

    return { success: true }
  },
})

export const linkToEncounter = mutation({
  args: {
    patientId: v.id('patients'),
    encounterId: v.id('encounters'),
  },
  handler: async (ctx, args) => {
    // Check if link already exists
    const existingLink = await ctx.db
      .query('patient_links')
      .withIndex('by_patient', (q) => q.eq('patientId', args.patientId))
      .filter((q) => q.eq(q.field('encounterId'), args.encounterId))
      .first()

    if (existingLink) {
      return existingLink._id
    }

    // Create new link
    const linkId = await ctx.db.insert('patient_links', {
      patientId: args.patientId,
      encounterId: args.encounterId,
      createdAt: Date.now(),
    })

    return linkId
  },
})

export const join = mutation({
  args: {
    encounterId: v.id('encounters'),
    participantId: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Update or create patient participant
    const existingParticipant = await ctx.db
      .query('participants')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .filter((q) => q.eq(q.field('role'), 'patient'))
      .first()

    if (existingParticipant) {
      await ctx.db.patch(existingParticipant._id, {
        presence: 'online',
        lastSeen: Date.now(),
        displayName: args.displayName || existingParticipant.displayName,
      })
    } else {
      await ctx.db.insert('participants', {
        encounterId: args.encounterId,
        role: 'patient',
        displayName: args.displayName || 'Patient',
        presence: 'online',
        lastSeen: Date.now(),
      })
    }

    // Log journal event
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: JOURNAL_EVENT_TYPES.PATIENT_JOINED,
      payload: { participantId: args.participantId, displayName: args.displayName },
      at: Date.now(),
    })

    return { success: true }
  },
})

export const leave = mutation({
  args: {
    encounterId: v.id('encounters'),
    participantId: v.string(),
  },
  handler: async (ctx, args) => {
    // Update patient participant presence
    const participant = await ctx.db
      .query('participants')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .filter((q) => q.eq(q.field('role'), 'patient'))
      .first()

    if (participant) {
      await ctx.db.patch(participant._id, {
        presence: 'offline',
        lastSeen: Date.now(),
      })
    }

    // Log journal event
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: JOURNAL_EVENT_TYPES.PATIENT_LEFT,
      payload: { participantId: args.participantId },
      at: Date.now(),
    })

    return { success: true }
  },
})

export const heartbeat = mutation({
  args: {
    encounterId: v.id('encounters'),
    participantId: v.string(),
  },
  handler: async (ctx, args) => {
    // Update participant's lastSeen timestamp
    const participant = await ctx.db
      .query('participants')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .filter((q) => q.eq(q.field('role'), 'patient'))
      .first()

    if (participant) {
      await ctx.db.patch(participant._id, {
        lastSeen: Date.now(),
      })
    }

    return { success: true }
  },
})
