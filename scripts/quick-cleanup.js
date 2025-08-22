const { ConvexHttpClient } = require('convex/browser');
const { api } = require('../convex/_generated/api');

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function quickCleanup() {
  console.log('🧹 Quick demo cleanup...');
  
  try {
    // Run auto-tidy to clean up stale encounters
    const tidyResult = await client.mutation(api.mutations.encounter.tidyStale, {});
    console.log(`✅ Auto-tidied ${tidyResult.tidiedCount} stale encounters`);
    
    // Clean up old queue entries
    const queueResult = await client.mutation(api.mutations.queue.cleanupOldQueueEntries, {
      olderThanMinutes: 5 // 5 minutes - more aggressive cleanup for immediate departures
    });
    console.log(`✅ Cleaned ${queueResult.cleanedCount} old queue entries`);
    
    // Get encounters to show what we have
    const encounters = await client.query(api.queries.encounters.listForProviderWithInvites, {
      providerId: 'provider-demo-001'
    });
    
    console.log(`📊 Current encounters: ${encounters?.length || 0} total`);
    
    if (encounters && encounters.length > 0) {
      const scheduled = encounters.filter(e => e.status === 'scheduled').length;
      const active = encounters.filter(e => e.status === 'active').length;
      const ended = encounters.filter(e => e.status === 'ended').length;
      
      console.log(`  - Scheduled: ${scheduled}`);
      console.log(`  - Active: ${active}`);
      console.log(`  - Ended: ${ended}`);
    }
    
    console.log('🎉 Quick cleanup complete!');
    console.log('\n💡 To clean up more aggressively, you can:');
    console.log('   1. Use the "Clear All Scheduled" button in the calendar');
    console.log('   2. Run: NEXT_PUBLIC_CONVEX_URL=https://perceptive-pika-647.convex.cloud node scripts/quick-cleanup.js');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

quickCleanup();
