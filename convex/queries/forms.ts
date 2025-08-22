import { query } from '../_generated/server'
import { v } from 'convex/values'

export const getAssignments = query({
  args: { encounterId: v.id('encounters') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('form_assignments')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()
  },
})

export const getSubmissions = query({
  args: { encounterId: v.id('encounters') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('form_submissions')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .collect()
  },
})

export const getFormStatus = query({
  args: { 
    encounterId: v.id('encounters'),
    formId: v.string(),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query('form_assignments')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .filter((q) => q.eq(q.field('formId'), args.formId))
      .first()

    const submission = await ctx.db
      .query('form_submissions')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .filter((q) => q.eq(q.field('formId'), args.formId))
      .first()

    return {
      assignment,
      submission,
      isAssigned: !!assignment,
      isSubmitted: !!submission,
      status: assignment?.status || 'not-assigned',
    }
  },
})
