import { mutation } from '../_generated/server'
import { v } from 'convex/values'
import { JOURNAL_EVENT_TYPES } from '../lib/constants'

export const assign = mutation({
  args: {
    encounterId: v.id('encounters'),
    formIdStub: v.string(),
  },
  handler: async (ctx, args) => {
    // Create or update workflow
    const existingWorkflow = await ctx.db
      .query('workflows')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .first()

    if (existingWorkflow) {
      await ctx.db.patch(existingWorkflow._id, {
        state: 'assigned',
        items: [...existingWorkflow.items, { formId: args.formIdStub, assignedAt: Date.now() }],
      })
    } else {
      await ctx.db.insert('workflows', {
        encounterId: args.encounterId,
        items: [{ formId: args.formIdStub, assignedAt: Date.now() }],
        state: 'assigned',
      })
    }

    // Log journal event
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: JOURNAL_EVENT_TYPES.FORM_ASSIGNED,
      payload: { formId: args.formIdStub },
      at: Date.now(),
    })

    return { success: true }
  },
})

export const submit = mutation({
  args: {
    encounterId: v.id('encounters'),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    // Update workflow state
    const workflow = await ctx.db
      .query('workflows')
      .withIndex('by_encounter', (q) => q.eq('encounterId', args.encounterId))
      .first()

    if (workflow) {
      await ctx.db.patch(workflow._id, {
        state: 'submitted',
        items: [...workflow.items, { submittedAt: Date.now(), payload: args.payload }],
      })
    }

    // Log journal event
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: JOURNAL_EVENT_TYPES.FORM_SUBMITTED,
      payload: args.payload,
      at: Date.now(),
    })

    return { success: true }
  },
})
