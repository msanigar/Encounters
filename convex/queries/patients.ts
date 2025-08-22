import { query } from '../_generated/server'
import { v } from 'convex/values'

export const get = query({
  args: { id: v.id('patients') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const list = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.search || args.search.trim() === '') {
      // Return recent patients if no search
      return await ctx.db
        .query('patients')
        .withIndex('by_created')
        .order('desc')
        .take(20)
    }

    const searchTerm = args.search.toLowerCase().trim()
    
    // Search by display name or email/phone
    const patients = await ctx.db.query('patients').collect()
    
    return patients
      .filter(patient => 
        patient.displayName.toLowerCase().includes(searchTerm) ||
        patient.emailOrPhone.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20)
  },
})

export const getWithEncounters = query({
  args: { patientId: v.id('patients') },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId)
    if (!patient) return null

    // Get all encounters for this patient
    const links = await ctx.db
      .query('patient_links')
      .withIndex('by_patient', (q) => q.eq('patientId', args.patientId))
      .order('desc')
      .collect()

    const encounters = await Promise.all(
      links.map(async (link) => {
        const encounter = await ctx.db.get(link.encounterId)
        return {
          ...encounter,
          linkCreatedAt: link.createdAt,
        }
      })
    )

    return {
      patient,
      encounters: encounters.filter(Boolean),
    }
  },
})

export const findByContact = query({
  args: { emailOrPhone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('patients')
      .withIndex('by_contact', (q) => q.eq('emailOrPhone', args.emailOrPhone))
      .first()
  },
})
