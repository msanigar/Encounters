import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'

const client = new ConvexHttpClient('https://perceptive-pika-647.convex.cloud')

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // Create sample encounters
    const encounters = [
      {
        providerId: 'provider-demo-001',
        providerRoom: 'demo-room',
        patientHint: { kind: 'email' as const, value: 'john.doe@example.com' },
        scheduledAt: Date.now() + 5 * 60 * 1000, // 5 minutes from now
      },
      {
        providerId: 'provider-demo-001',
        providerRoom: 'demo-room',
        patientHint: { kind: 'email' as const, value: 'jane.smith@example.com' },
        scheduledAt: Date.now(), // Now
      },
      {
        providerId: 'provider-demo-001',
        providerRoom: 'demo-room',
        patientHint: { kind: 'email' as const, value: 'bob.wilson@example.com' },
        scheduledAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
      },
    ]

    const createdEncounters = []

    for (const encounterData of encounters) {
      const result = await client.mutation(api.mutations.invites.create, encounterData)
      createdEncounters.push(result)
      console.log(`✅ Created encounter: ${encounterData.patientHint.value}`)
      console.log(`   Invite URL: http://localhost:3000/${encounterData.providerRoom}/${result.oit}`)
    }

    console.log('\n🎉 Seeding complete!')
    console.log('\n📋 Sample Invite URLs:')
    createdEncounters.forEach((encounter, index) => {
      const patientName = encounters[index].patientHint.value
      console.log(`   ${patientName}: http://localhost:3000${encounter.inviteUrl}`)
    })

    console.log('\n🔑 Provider Login:')
    console.log('   Email: provider@demo.test')
    console.log('   Password: demo123')
    console.log('   URL: http://localhost:3000/provider/login')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seed()
