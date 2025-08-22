import { mutation } from './_generated/server'
import { v } from 'convex/values'

export const authenticateProvider = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // In a real application, this would validate against a secure database
    // For this POC, we'll use a simple check against demo credentials
    const validCredentials = {
      email: 'provider@demo.test',
      password: 'demo123',
      id: 'provider-demo-001',
      name: 'Dr. Provider',
      room: 'demo-room'
    }

    if (args.email === validCredentials.email && args.password === validCredentials.password) {
      // Create or update provider session
      const existingSession = await ctx.db
        .query('provider_sessions')
        .withIndex('by_provider', (q) => q.eq('providerId', validCredentials.id))
        .first()

      const sessionData = {
        providerId: validCredentials.id,
        providerName: validCredentials.name,
        providerRoom: validCredentials.room,
        email: validCredentials.email,
        lastLoginAt: Date.now(),
        isActive: true
      }

      if (existingSession) {
        await ctx.db.patch(existingSession._id, sessionData)
        return {
          success: true,
          sessionId: existingSession._id,
          provider: {
            id: validCredentials.id,
            name: validCredentials.name,
            room: validCredentials.room,
            email: validCredentials.email
          }
        }
      } else {
        const sessionId = await ctx.db.insert('provider_sessions', sessionData)
        return {
          success: true,
          sessionId,
          provider: {
            id: validCredentials.id,
            name: validCredentials.name,
            room: validCredentials.room,
            email: validCredentials.email
          }
        }
      }
    }

    return {
      success: false,
      error: 'Invalid credentials'
    }
  },
})

export const logoutProvider = mutation({
  args: {
    sessionId: v.id('provider_sessions'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      isActive: false,
      loggedOutAt: Date.now()
    })
    
    return { success: true }
  },
})

export const validateSession = mutation({
  args: {
    sessionId: v.id('provider_sessions'),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    
    if (!session || !session.isActive) {
      return { valid: false }
    }

    // Check if session is not expired (24 hours)
    const sessionAge = Date.now() - session.lastLoginAt
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    if (sessionAge > maxAge) {
      await ctx.db.patch(args.sessionId, {
        isActive: false,
        expiredAt: Date.now()
      })
      return { valid: false }
    }

    return {
      valid: true,
      provider: {
        id: session.providerId,
        name: session.providerName,
        room: session.providerRoom,
        email: session.email
      }
    }
  },
})
