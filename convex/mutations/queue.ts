import { mutation } from '../_generated/server'
import { v } from 'convex/values'

export const checkIn = mutation({
  args: {
    providerId: v.string(),
    providerRoom: v.string(),
    displayName: v.string(),
    reasonForVisit: v.string(),
    contactInfo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current queue position (highest + 1)
    const lastInQueue = await ctx.db
      .query('preencounter_visits')
      .withIndex('by_provider', (q) => q.eq('providerId', args.providerId))
      .filter((q) => q.eq(q.field('status'), 'waiting'))
      .order('desc')
      .first()

    const queuePosition = (lastInQueue?.queuePosition || 0) + 1

    // Calculate estimated wait time (5 minutes per person ahead)
    const estimatedWaitTime = Math.max(0, (queuePosition - 1) * 5)

    // Create preencounter visit
    const visitId = await ctx.db.insert('preencounter_visits', {
      providerId: args.providerId,
      providerRoom: args.providerRoom,
      displayName: args.displayName,
      reasonForVisit: args.reasonForVisit,
      contactInfo: args.contactInfo,
      status: 'waiting',
      queuePosition,
      checkedInAt: Date.now(),
      estimatedWaitTime,
    })

    return {
      visitId,
      queuePosition,
      estimatedWaitTime,
    }
  },
})

export const convertToEncounter = mutation({
  args: {
    visitId: v.id('preencounter_visits'),
  },
  handler: async (ctx, args) => {
    const visit = await ctx.db.get(args.visitId)
    if (!visit) {
      throw new Error('Visit not found')
    }

    // Create or find patient
    let patientId: string | undefined
    if (visit.contactInfo) {
      const existingPatient = await ctx.db
        .query('patients')
        .withIndex('by_contact', (q) => q.eq('emailOrPhone', visit.contactInfo!))
        .first()

      if (existingPatient) {
        patientId = existingPatient._id
      } else {
        patientId = await ctx.db.insert('patients', {
          displayName: visit.displayName,
          emailOrPhone: visit.contactInfo,
          createdAt: Date.now(),
        })
      }
    }

    // Create encounter
    const encounterId = await ctx.db.insert('encounters', {
      providerId: visit.providerId,
      providerRoom: visit.providerRoom,
      patientHint: visit.contactInfo ? {
        kind: visit.contactInfo.includes('@') ? 'email' : 'phone',
        value: visit.contactInfo,
      } : null, // No patient hint if no contact info
      scheduledAt: Date.now(),
      status: 'active',
      createdAt: Date.now(),
      endedAt: null,
    })

    // Create LiveKit room
    const livekitRoom = `room_${encounterId}_${Date.now()}`
    await ctx.db.insert('rooms', {
      encounterId,
      livekitRoom,
      policy: {
        allowAlone: true,
      },
      active: true,
    })

    // Link patient if exists
    if (patientId) {
      await ctx.db.insert('patient_links', {
        patientId: patientId as any,
        encounterId,
        createdAt: Date.now(),
      })
    }

    // Create permissions
    await ctx.db.insert('permissions', {
      encounterId,
      canJoin: [visit.providerId],
      canPublish: [visit.providerId],
      canEnd: [visit.providerId],
    })

    // Auto-assign intake form
    await ctx.db.insert('form_assignments', {
      encounterId,
      formId: 'intake',
      assignedAt: Date.now(),
      status: 'incomplete',
    })

    // Update visit status and link to encounter
    await ctx.db.patch(args.visitId, {
      status: 'in-progress',
      encounterId,
    })

    // Log encounter creation
    await ctx.db.insert('journal_events', {
      encounterId,
      type: 'NOTE_ADDED',
      payload: {
        message: `Walk-in encounter created from queue for ${visit.displayName}`,
        reasonForVisit: visit.reasonForVisit,
        queuePosition: visit.queuePosition,
      },
      at: Date.now(),
    })

    return {
      encounterId,
      livekitRoom,
      patientId,
    }
  },
})

export const updateQueueStatus = mutation({
  args: {
    visitId: v.id('preencounter_visits'),
    status: v.union(
      v.literal('waiting'),
      v.literal('in-progress'),
      v.literal('completed'),
      v.literal('cancelled')
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.visitId, {
      status: args.status,
    })

    return args.visitId
  },
})
