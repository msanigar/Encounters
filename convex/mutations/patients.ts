import { mutation } from '../_generated/server'
import { v } from 'convex/values'

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
      encounterId: null, // No specific encounter for patient creation
      type: 'NOTE_ADDED',
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

export const linkToEncounter = mutation({
  args: {
    patientId: v.id('patients'),
    encounterId: v.id('encounters'),
  },
  handler: async (ctx, args) => {
    // Check if link already exists
    const existingLink = await ctx.db
      .query('patient_links')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
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
