import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  encounters: defineTable({
    providerId: v.string(),
    providerRoom: v.string(),
    patientHint: v.union(
      v.object({
        kind: v.union(v.literal('email'), v.literal('phone')),
        value: v.string(),
      }),
      v.null()
    ),
    scheduledAt: v.union(v.number(), v.null()),
    status: v.union(
      v.literal('scheduled'),
      v.literal('active'),
      v.literal('paused'),
      v.literal('ended')
    ),
    createdAt: v.number(),
    endedAt: v.union(v.number(), v.null()),
  })
    .index('by_provider', ['providerId'])
    .index('by_status', ['status'])
    .index('by_scheduled', ['scheduledAt']),

  invites: defineTable({
    encounterId: v.id('encounters'),
    channel: v.union(v.literal('email'), v.literal('sms'), v.literal('link')),
    target: v.string(),
    oit: v.string(),
    redeemedAt: v.union(v.number(), v.null()),
  })
    .index('by_oit', ['oit'])
    .index('by_encounter', ['encounterId']),

  sessions: defineTable({
    encounterId: v.id('encounters'),
    participantId: v.string(),
    role: v.union(v.literal('provider'), v.literal('patient'), v.literal('staff')),
    deviceNonce: v.string(),
    rrtHash: v.string(),
    rrtExpiresAt: v.number(),
    active: v.boolean(),
  })
    .index('by_encounter', ['encounterId'])
    .index('by_device', ['deviceNonce'])
    .index('by_active', ['active']),

  participants: defineTable({
    encounterId: v.id('encounters'),
    role: v.union(v.literal('provider'), v.literal('patient'), v.literal('staff')),
    displayName: v.union(v.string(), v.null()),
    presence: v.union(v.literal('online'), v.literal('offline')),
    lastSeen: v.number(),
  })
    .index('by_encounter', ['encounterId'])
    .index('by_presence', ['presence']),

  rooms: defineTable({
    encounterId: v.id('encounters'),
    livekitRoom: v.string(),
    policy: v.object({
      allowAlone: v.boolean(),
    }),
    active: v.boolean(),
  })
    .index('by_encounter', ['encounterId'])
    .index('by_livekit_room', ['livekitRoom']),

  permissions: defineTable({
    encounterId: v.id('encounters'),
    canJoin: v.array(v.string()),
    canPublish: v.array(v.string()),
    canEnd: v.array(v.string()),
  }).index('by_encounter', ['encounterId']),

  journal_events: defineTable({
    encounterId: v.union(v.id('encounters'), v.null()),
    type: v.string(),
    payload: v.any(),
    at: v.number(),
  })
    .index('by_encounter', ['encounterId'])
    .index('by_type', ['type'])
    .index('by_time', ['at']),

  workflows: defineTable({
    encounterId: v.id('encounters'),
    items: v.array(v.any()),
    state: v.union(
      v.literal('none'),
      v.literal('assigned'),
      v.literal('submitted')
    ),
  }).index('by_encounter', ['encounterId']),

  patients: defineTable({
    displayName: v.string(),
    emailOrPhone: v.string(),
    createdAt: v.number(),
  })
    .index('by_contact', ['emailOrPhone'])
    .index('by_created', ['createdAt']),

  patient_links: defineTable({
    patientId: v.id('patients'),
    encounterId: v.id('encounters'),
    createdAt: v.number(),
  })
    .index('by_patient', ['patientId'])
    .index('by_encounter', ['encounterId'])
    .index('by_created', ['createdAt']),

  form_assignments: defineTable({
    encounterId: v.id('encounters'),
    formId: v.string(), // 'intake' for now
    assignedAt: v.number(),
    status: v.union(
      v.literal('incomplete'),
      v.literal('in-progress'),
      v.literal('complete')
    ),
  })
    .index('by_encounter', ['encounterId'])
    .index('by_form', ['formId'])
    .index('by_status', ['status']),

  form_submissions: defineTable({
    encounterId: v.id('encounters'),
    patientId: v.optional(v.id('patients')),
    formId: v.string(),
    answers: v.any(), // JSON object with form answers
    submittedAt: v.number(),
  })
    .index('by_encounter', ['encounterId'])
    .index('by_patient', ['patientId'])
    .index('by_form', ['formId'])
    .index('by_submitted', ['submittedAt']),

  preencounter_visits: defineTable({
    providerId: v.string(),
    providerRoom: v.string(),
    displayName: v.string(),
    reasonForVisit: v.string(),
    contactInfo: v.optional(v.string()), // email or phone
    status: v.union(
      v.literal('waiting'),
      v.literal('in-progress'),
      v.literal('completed'),
      v.literal('cancelled')
    ),
    queuePosition: v.number(),
    checkedInAt: v.number(),
    estimatedWaitTime: v.optional(v.number()), // minutes
    encounterId: v.optional(v.id('encounters')), // Set when converted to encounter
    participantId: v.optional(v.string()), // Set when converted to encounter
  })
    .index('by_provider', ['providerId'])
    .index('by_room', ['providerRoom'])
    .index('by_status', ['status'])
    .index('by_queue', ['queuePosition'])
    .index('by_checkin', ['checkedInAt']),

  notes: defineTable({
    encounterId: v.id('encounters'),
    patientId: v.optional(v.id('patients')),
    providerId: v.string(),
    content: v.string(),
    type: v.union(
      v.literal('general'),
      v.literal('assessment'),
      v.literal('treatment'),
      v.literal('followup')
    ),
    createdAt: v.number(),
  })
    .index('by_encounter', ['encounterId'])
    .index('by_patient', ['patientId'])
    .index('by_provider', ['providerId'])
    .index('by_created', ['createdAt']),

  provider_sessions: defineTable({
    providerId: v.string(),
    providerName: v.string(),
    providerRoom: v.string(),
    email: v.string(),
    lastLoginAt: v.number(),
    isActive: v.boolean(),
    loggedOutAt: v.optional(v.number()),
    expiredAt: v.optional(v.number()),
  })
    .index('by_provider', ['providerId'])
    .index('by_active', ['isActive'])
    .index('by_email', ['email']),
})
