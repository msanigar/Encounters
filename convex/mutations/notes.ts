import { mutation } from '../_generated/server'
import { v } from 'convex/values'

export const createNote = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const noteId = await ctx.db.insert('notes', {
      encounterId: args.encounterId,
      patientId: args.patientId,
      providerId: args.providerId,
      content: args.content,
      type: args.type,
      createdAt: Date.now(),
    })

    // Log note creation to journal
    await ctx.db.insert('journal_events', {
      encounterId: args.encounterId,
      type: 'NOTE_ADDED',
      payload: {
        noteId,
        type: args.type,
        content: args.content.substring(0, 100) + (args.content.length > 100 ? '...' : ''),
      },
      at: Date.now(),
    })

    return noteId
  },
})

export const updateNote = mutation({
  args: {
    noteId: v.id('notes'),
    content: v.string(),
    type: v.union(
      v.literal('general'),
      v.literal('assessment'),
      v.literal('treatment'),
      v.literal('followup')
    ),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId)
    if (!note) {
      throw new Error('Note not found')
    }

    await ctx.db.patch(args.noteId, {
      content: args.content,
      type: args.type,
    })

    // Log note update to journal
    await ctx.db.insert('journal_events', {
      encounterId: note.encounterId,
      type: 'NOTE_UPDATED',
      payload: {
        noteId: args.noteId,
        type: args.type,
        content: args.content.substring(0, 100) + (args.content.length > 100 ? '...' : ''),
      },
      at: Date.now(),
    })

    return args.noteId
  },
})

export const deleteNote = mutation({
  args: {
    noteId: v.id('notes'),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId)
    if (!note) {
      throw new Error('Note not found')
    }

    await ctx.db.delete(args.noteId)

    // Log note deletion to journal
    await ctx.db.insert('journal_events', {
      encounterId: note.encounterId,
      type: 'NOTE_DELETED',
      payload: {
        noteId: args.noteId,
        type: note.type,
      },
      at: Date.now(),
    })

    return args.noteId
  },
})
