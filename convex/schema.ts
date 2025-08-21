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
    encounterId: v.id('encounters'),
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
})
