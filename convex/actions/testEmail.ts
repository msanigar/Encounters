'use node'

import { action } from '../_generated/server'
import { v } from 'convex/values'
import { api } from '../_generated/api'

export const testEmail = action({
  args: {
    to: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    console.log('🧪 Testing email functionality...')
    
    try {
      const result: any = await ctx.runAction(api.actions.email.sendInviteEmail, {
        to: args.to,
        providerName: 'Dr. Test Provider',
        when: Date.now() + 24 * 60 * 60 * 1000, // Tomorrow
        inviteUrl: 'http://localhost:3000/test-room/test-oit',
      })
      
      console.log('✅ Test email result:', result)
      return result
    } catch (error) {
      console.error('❌ Test email failed:', error)
      throw error
    }
  },
})
