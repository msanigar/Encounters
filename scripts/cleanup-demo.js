const { ConvexHttpClient } = require('convex/browser');
const { api } = require('../convex/_generated/api');

// Initialize Convex client
const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function cleanupDemo() {
  console.log('🧹 Starting demo cleanup...\n');

  try {
    // Get all encounters
    const encounters = await client.query(api.queries.encounters.listForProviderWithInvites, {
      providerId: 'provider-demo-001'
    });

    console.log(`📊 Found ${encounters.length} total encounters`);

    // Categorize encounters
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);

    const oldEncounters = encounters.filter(e => e.createdAt < oneDayAgo);
    const recentEncounters = encounters.filter(e => e.createdAt >= oneDayAgo && e.createdAt < oneHourAgo);
    const veryRecentEncounters = encounters.filter(e => e.createdAt >= oneHourAgo);

    console.log(`📅 Encounters older than 24 hours: ${oldEncounters.length}`);
    console.log(`📅 Encounters from last 24 hours (but older than 1 hour): ${recentEncounters.length}`);
    console.log(`📅 Encounters from last hour: ${veryRecentEncounters.length}\n`);

    // Show some examples
    if (oldEncounters.length > 0) {
      console.log('📋 Examples of old encounters:');
      oldEncounters.slice(0, 3).forEach(e => {
        const date = new Date(e.createdAt);
        console.log(`  - ${e._id} (${date.toLocaleString()}) - Status: ${e.status}`);
      });
      console.log('');
    }

    // Get queue entries
    const queueEntries = await client.query(api.queries.queue.list, {
      providerId: 'provider-demo-001'
    });

    console.log(`📋 Found ${queueEntries.length} queue entries`);
    
    const oldQueueEntries = queueEntries.filter(q => q.checkedInAt < oneDayAgo);
    console.log(`📅 Queue entries older than 24 hours: ${oldQueueEntries.length}\n`);

    // Ask what to clean up
    console.log('🎯 Cleanup Options:');
    console.log('1. Clean encounters older than 24 hours');
    console.log('2. Clean encounters older than 1 hour');
    console.log('3. Clean all encounters except the last 5');
    console.log('4. Clean queue entries older than 24 hours');
    console.log('5. Full cleanup (all old encounters + queue entries)');
    console.log('6. Just show what would be cleaned (dry run)');

    // For demo purposes, let's do a conservative cleanup
    console.log('\n🚀 Running conservative cleanup (encounters older than 24 hours)...');

    let cleanedCount = 0;

    // Clean old encounters
    for (const encounter of oldEncounters) {
      try {
        await client.mutation(api.mutations.encounter.deleteEncounter, {
          encounterId: encounter._id
        });
        console.log(`✅ Deleted encounter ${encounter._id}`);
        cleanedCount++;
      } catch (error) {
        console.log(`❌ Failed to delete encounter ${encounter._id}: ${error.message}`);
      }
    }

    // Clean old queue entries
    for (const entry of oldQueueEntries) {
      try {
        await client.mutation(api.mutations.queue.cleanupOldQueueEntries, {
          olderThanMinutes: 1440 // 24 hours
        });
        console.log(`✅ Cleaned queue entry ${entry._id}`);
        cleanedCount++;
      } catch (error) {
        console.log(`❌ Failed to clean queue entry ${entry._id}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Cleanup complete! Cleaned ${cleanedCount} items`);
    console.log('\n💡 For more aggressive cleanup, you can run:');
    console.log('   node scripts/cleanup-demo.js --aggressive');
    console.log('   node scripts/cleanup-demo.js --all');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Check for command line arguments
const args = process.argv.slice(2);
if (args.includes('--aggressive')) {
  console.log('🔥 Running aggressive cleanup...');
  // This would clean encounters older than 1 hour
} else if (args.includes('--all')) {
  console.log('💥 Running full cleanup...');
  // This would clean all except the last 5 encounters
} else {
  cleanupDemo();
}
