import { query } from '../_generated/server'
import { v } from 'convex/values'

export const getEncountersForDateRange = query({
  args: { 
    providerId: v.string(),
    startDate: v.number(), // timestamp
    endDate: v.number(),   // timestamp
  },
  handler: async (ctx, args) => {
    const encounters = await ctx.db
      .query('encounters')
      .withIndex('by_provider', (q) => q.eq('providerId', args.providerId))
      .filter((q) => 
        q.and(
          q.gte(q.field('scheduledAt'), args.startDate),
          q.lte(q.field('scheduledAt'), args.endDate)
        )
      )
      .collect()

    // Get patient info for each encounter
    const encountersWithPatients = await Promise.all(
      encounters.map(async (encounter) => {
        const patientLink = await ctx.db
          .query('patient_links')
          .withIndex('by_encounter', (q) => q.eq('encounterId', encounter._id))
          .first()

        let patient = null
        if (patientLink) {
          patient = await ctx.db.get(patientLink.patientId)
        }

        return {
          ...encounter,
          patient,
        }
      })
    )

    return encountersWithPatients
  },
})

export const getEncountersForMonth = query({
  args: { 
    providerId: v.string(),
    year: v.number(),
    month: v.number(), // 0-based (0 = January)
  },
  handler: async (ctx, args) => {
    const startOfMonth = new Date(args.year, args.month, 1).getTime()
    const endOfMonth = new Date(args.year, args.month + 1, 0, 23, 59, 59, 999).getTime()

    const encounters = await ctx.db
      .query('encounters')
      .withIndex('by_provider', (q) => q.eq('providerId', args.providerId))
      .filter((q) => 
        q.and(
          q.gte(q.field('scheduledAt'), startOfMonth),
          q.lte(q.field('scheduledAt'), endOfMonth)
        )
      )
      .collect()

    // Get patient info for each encounter
    const encountersWithPatients = await Promise.all(
      encounters.map(async (encounter) => {
        const patientLink = await ctx.db
          .query('patient_links')
          .withIndex('by_encounter', (q) => q.eq('encounterId', encounter._id))
          .first()

        let patient = null
        if (patientLink) {
          patient = await ctx.db.get(patientLink.patientId)
        }

        return {
          ...encounter,
          patient,
        }
      })
    )

    return encountersWithPatients
  },
})

export const getEncountersForWeek = query({
  args: { 
    providerId: v.string(),
    weekStartDate: v.number(), // timestamp of week start (Monday)
  },
  handler: async (ctx, args) => {
    const weekStart = args.weekStartDate
    const weekEnd = weekStart + (7 * 24 * 60 * 60 * 1000) - 1 // End of Sunday

    const encounters = await ctx.db
      .query('encounters')
      .withIndex('by_provider', (q) => q.eq('providerId', args.providerId))
      .filter((q) => 
        q.and(
          q.gte(q.field('scheduledAt'), weekStart),
          q.lte(q.field('scheduledAt'), weekEnd)
        )
      )
      .collect()

    // Get patient info for each encounter
    const encountersWithPatients = await Promise.all(
      encounters.map(async (encounter) => {
        const patientLink = await ctx.db
          .query('patient_links')
          .withIndex('by_encounter', (q) => q.eq('encounterId', encounter._id))
          .first()

        let patient = null
        if (patientLink) {
          patient = await ctx.db.get(patientLink.patientId)
        }

        return {
          ...encounter,
          patient,
        }
      })
    )

    return encountersWithPatients
  },
})
