import { mutation } from '../_generated/server'
import { v } from 'convex/values'

export const assignForm = mutation({
  args: {
    encounterId: v.id('encounters'),
    formId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if form is already assigned
    const existing = await ctx.db
      .query('form_assignments')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .filter((q) => q.eq(q.field('formId'), args.formId))
      .first()

    if (existing) {
      return existing._id
    }

    // Create new assignment
    const assignmentId = await ctx.db.insert('form_assignments', {
      encounterId: args.encounterId,
      formId: args.formId,
      assignedAt: Date.now(),
      status: 'incomplete',
    })

    // Log assignment
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: 'FORM_ASSIGNED',
      payload: {
        formId: args.formId,
        assignmentId,
      },
      at: Date.now(),
    })

    return assignmentId
  },
})

export const submitForm = mutation({
  args: {
    encounterId: v.id('encounters'),
    patientId: v.optional(v.id('patients')),
    formId: v.string(),
    answers: v.any(),
  },
  handler: async (ctx, args) => {
    // Create submission
    const submissionId = await ctx.db.insert('form_submissions', {
      encounterId: args.encounterId,
      patientId: args.patientId,
      formId: args.formId,
      answers: args.answers,
      submittedAt: Date.now(),
    })

    // Update assignment status
    const assignment = await ctx.db
      .query('form_assignments')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .filter((q) => q.eq(q.field('formId'), args.formId))
      .first()

    if (assignment) {
      await ctx.db.patch(assignment._id, {
        status: 'complete',
      })
    }

    // Log submission
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: 'FORM_SUBMITTED',
      payload: {
        formId: args.formId,
        submissionId,
        patientId: args.patientId,
        answersCount: Object.keys(args.answers || {}).length,
      },
      at: Date.now(),
    })

    return submissionId
  },
})

export const updateFormProgress = mutation({
  args: {
    encounterId: v.id('encounters'),
    formId: v.string(),
    status: v.union(v.literal('incomplete'), v.literal('in-progress'), v.literal('complete')),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query('form_assignments')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .filter((q) => q.eq(q.field('formId'), args.formId))
      .first()

    if (!assignment) {
      throw new Error('Form assignment not found')
    }

    await ctx.db.patch(assignment._id, {
      status: args.status,
    })

    return assignment._id
  },
})
