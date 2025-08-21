'use node'

import { action } from '../_generated/server'
import { v } from 'convex/values'
import { AccessToken } from 'livekit-server-sdk'

export const generateToken = action({
  args: {
    roomName: v.string(),
    participantId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get LiveKit credentials from environment variables
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    
    if (!apiKey || !apiSecret) {
      throw new Error('LiveKit API credentials not configured. Please set LIVEKIT_API_KEY and LIVEKIT_API_SECRET environment variables.')
    }

    try {
      // Create access token using official LiveKit SDK
      const at = new AccessToken(apiKey, apiSecret, {
        identity: args.participantId,
        ttl: 60 * 60, // 1 hour
      })

      at.addGrant({
        room: args.roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      })

      const token = await at.toJwt()
      
      return {
        token,
        roomName: args.roomName,
      }
    } catch (error) {
      console.error('❌ Failed to generate LiveKit token:', error)
      throw error
    }
  },
})
