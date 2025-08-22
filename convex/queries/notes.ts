import { query } from '../_generated/server'
import { v } from 'convex/values'

export const getNotesForEncounter = query({
  args: {
    encounterId: v.id('encounters'),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query('notes')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .order('desc')
      .collect()

    return notes
  },
})

export const getNotesForPatient = query({
  args: {
    patientId: v.id('patients'),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query('notes')
      .withIndex('by_patient', (q) => q.eq('patientId', args.patientId))
      .order('desc')
      .collect()

    return notes
  },
})

export const getNotesByProvider = query({
  args: {
    providerId: v.string(),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query('notes')
      .withIndex('by_provider', (q) => q.eq('providerId', args.providerId))
      .order('desc')
      .collect()

    return notes
  },
})
