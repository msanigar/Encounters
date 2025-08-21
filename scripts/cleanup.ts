import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

async function cleanup() {
  console.log('🧹 Starting cleanup...')
  console.log(`🔗 Using Convex URL: ${process.env.NEXT_PUBLIC_CONVEX_URL}`)

  try {
    // Clear all invites/OITs
    console.log('🗑️ Clearing all invites/OITs...')
    await client.mutation(api.mutations.cleanup.clearAllInvites)

    // Clear all encounters
    console.log('🗑️ Clearing all encounters...')
    await client.mutation(api.mutations.cleanup.clearAllEncounters)

    // Clear all participants
    console.log('🗑️ Clearing all participants...')
    await client.mutation(api.mutations.cleanup.clearAllParticipants)

    // Clear all sessions
    console.log('🗑️ Clearing all sessions...')
    await client.mutation(api.mutations.cleanup.clearAllSessions)

    // Clear all rooms
    console.log('🗑️ Clearing all rooms...')
    await client.mutation(api.mutations.cleanup.clearAllRooms)

    // Clear all journal events
    console.log('🗑️ Clearing all journal events...')
    await client.mutation(api.mutations.cleanup.clearAllJournalEvents)

    // Clear all workflows
    console.log('🗑️ Clearing all workflows...')
    await client.mutation(api.mutations.cleanup.clearAllWorkflows)

    // Clear all permissions
    console.log('🗑️ Clearing all permissions...')
    await client.mutation(api.mutations.cleanup.clearAllPermissions)

    console.log('✅ Cleanup complete!')
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
}

cleanup()
