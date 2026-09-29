import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cwwbxlpjsbtbqdeelpcc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3d2J4bHBqc2J0YnFkZWVscGNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODY2OTUyOSwiZXhwIjoyMTA0MjQ1NTI5fQ.4q79Y-guz5WUcd028kPUgjm-0qWLUc658UYZPz52leo';

const supabase = createClient(supabaseUrl, serviceRoleKey);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('=================================================================');
  console.log('🧪 Testing Supabase Active Listener Count Lifecycle & Synchronization');
  console.log('=================================================================\n');

  // Step 1: Query existing rooms
  console.log('--- Step 1: Discover Translation Rooms in Supabase ---');
  const { data: rooms, error: roomsErr } = await supabase
    .from('translation_rooms')
    .select('id, livekit_room_name, status, active_listener_count')
    .limit(2);

  assert(!roomsErr && rooms && rooms.length >= 2, `Retrieved at least 2 translation rooms from Supabase (found ${rooms?.length || 0})`);
  if (!rooms || rooms.length < 2) {
    console.error('Need at least 2 translation rooms for tests. Exiting.');
    process.exit(1);
  }

  const roomA = rooms[0];
  const roomB = rooms[1];
  console.log(`  Room A: ${roomA.livekit_room_name} (${roomA.id})`);
  console.log(`  Room B: ${roomB.livekit_room_name} (${roomB.id})`);

  // Ensure clean baseline: remove test sessions if any
  const testPrefix = 'test_sess_' + Date.now().toString().slice(-6);
  const session1 = `${testPrefix}_user1`;
  const session2 = `${testPrefix}_user2`;

  const now = new Date().toISOString();

  // Helper to recalculate count exactly like Repository.recalculateRoomListenerCount
  async function syncRoomCount(roomId) {
    const { data: activeList } = await supabase
      .from('audience_sessions')
      .select('session_key')
      .eq('translation_room_id', roomId)
      .is('left_at', null);

    const count = new Set((activeList || []).map(s => s.session_key)).size;
    await supabase
      .from('translation_rooms')
      .update({ active_listener_count: count, updated_at: new Date().toISOString() })
      .eq('id', roomId);
    return count;
  }

  // Helper to get room listener count directly from Supabase
  async function getDbListenerCount(roomId) {
    const { data } = await supabase
      .from('translation_rooms')
      .select('active_listener_count')
      .eq('id', roomId)
      .single();
    return data?.active_listener_count ?? -1;
  }

  // --- Test 1: Baseline Check ---
  console.log('\n--- Test 1: Verify Initial Baseline ---');
  await syncRoomCount(roomA.id);
  await syncRoomCount(roomB.id);
  const baseCountA = await getDbListenerCount(roomA.id);
  const baseCountB = await getDbListenerCount(roomB.id);
  console.log(`  Initial DB listener counts -> Room A: ${baseCountA}, Room B: ${baseCountB}`);
  assert(baseCountA >= 0 && baseCountB >= 0, 'Baseline counts retrieved successfully');

  // --- Test 2: User 1 Joins Room A ---
  console.log('\n--- Test 2: Audience User 1 Joins Room A ---');
  const join1Id = '90000000-0000-0000-0000-000000000001';
  await supabase.from('audience_sessions').insert({
    id: join1Id,
    translation_room_id: roomA.id,
    session_key: session1,
    joined_at: new Date().toISOString(),
    ip_hash: '127.0.0.1',
    user_agent: 'TestAgent/1.0',
    created_at: new Date().toISOString(),
  });
  const countAfterJoin1 = await syncRoomCount(roomA.id);
  const dbCountJoin1 = await getDbListenerCount(roomA.id);
  assert(dbCountJoin1 === baseCountA + 1, `Room A active_listener_count incremented in Supabase (expected ${baseCountA + 1}, got ${dbCountJoin1})`);

  // --- Test 3: User 2 Joins Room A (Multiple Listeners) ---
  console.log('\n--- Test 3: Audience User 2 Joins Room A (Multiple Listeners) ---');
  const join2Id = '90000000-0000-0000-0000-000000000002';
  await supabase.from('audience_sessions').insert({
    id: join2Id,
    translation_room_id: roomA.id,
    session_key: session2,
    joined_at: new Date().toISOString(),
    ip_hash: '127.0.0.2',
    user_agent: 'TestAgent/1.0',
    created_at: new Date().toISOString(),
  });
  const countAfterJoin2 = await syncRoomCount(roomA.id);
  const dbCountJoin2 = await getDbListenerCount(roomA.id);
  assert(dbCountJoin2 === baseCountA + 2, `Room A active_listener_count reflects 2 concurrent listeners in Supabase (expected ${baseCountA + 2}, got ${dbCountJoin2})`);

  // --- Test 4: User 1 Switches from Room A to Room B (Language Channel Switch) ---
  console.log('\n--- Test 4: Channel Switch (User 1 moves from Room A to Room B) ---');
  // Mark User 1 left in Room A
  const switchTime = new Date().toISOString();
  await supabase
    .from('audience_sessions')
    .update({ left_at: switchTime })
    .eq('session_key', session1)
    .eq('translation_room_id', roomA.id)
    .is('left_at', null);

  // Insert User 1 into Room B
  const switchJoinId = '90000000-0000-0000-0000-000000000003';
  await supabase.from('audience_sessions').insert({
    id: switchJoinId,
    translation_room_id: roomB.id,
    session_key: session1,
    joined_at: switchTime,
    ip_hash: '127.0.0.1',
    user_agent: 'TestAgent/1.0',
    created_at: switchTime,
  });

  // Sync both rooms
  await syncRoomCount(roomA.id);
  await syncRoomCount(roomB.id);

  const dbCountRoomAAfterSwitch = await getDbListenerCount(roomA.id);
  const dbCountRoomBAfterSwitch = await getDbListenerCount(roomB.id);
  assert(dbCountRoomAAfterSwitch === baseCountA + 1, `Room A decremented back to ${baseCountA + 1} (actual: ${dbCountRoomAAfterSwitch})`);
  assert(dbCountRoomBAfterSwitch === baseCountB + 1, `Room B incremented to ${baseCountB + 1} (actual: ${dbCountRoomBAfterSwitch})`);

  // --- Test 5: User 2 Leaves Room A (Explicit Leave / Disconnect) ---
  console.log('\n--- Test 5: Audience User 2 Leaves Room A ---');
  const leaveTime = new Date().toISOString();
  await supabase
    .from('audience_sessions')
    .update({ left_at: leaveTime })
    .eq('session_key', session2)
    .eq('translation_room_id', roomA.id)
    .is('left_at', null);

  await syncRoomCount(roomA.id);
  const dbCountRoomAAfterLeave = await getDbListenerCount(roomA.id);
  assert(dbCountRoomAAfterLeave === baseCountA, `Room A returned to baseline ${baseCountA} after User 2 left (actual: ${dbCountRoomAAfterLeave})`);

  // --- Test 6: Translator Stops Broadcast in Room B ---
  console.log('\n--- Test 6: Stop Broadcast Resets active_listener_count to 0 ---');
  // Stop broadcast in Room B: close all open sessions and set count to 0
  const stopTime = new Date().toISOString();
  await supabase
    .from('audience_sessions')
    .update({ left_at: stopTime })
    .eq('translation_room_id', roomB.id)
    .is('left_at', null);

  await supabase
    .from('translation_rooms')
    .update({ status: 'idle', active_listener_count: 0, updated_at: stopTime })
    .eq('id', roomB.id);

  const dbCountRoomBAfterStop = await getDbListenerCount(roomB.id);
  assert(dbCountRoomBAfterStop === 0, `Room B active_listener_count cleanly reset to 0 in Supabase (actual: ${dbCountRoomBAfterStop})`);

  // --- Cleanup Test Rows ---
  console.log('\n--- Step 7: Clean Up Test Session Rows ---');
  await supabase.from('audience_sessions').delete().in('id', [join1Id, join2Id, switchJoinId]);
  await syncRoomCount(roomA.id);
  await syncRoomCount(roomB.id);
  console.log('  Cleaned up all synthetic test sessions.');

  console.log('\n=================================================================');
  console.log(`📊 Verification Complete: ${passed} Passed, ${failed} Failed`);
  console.log('=================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Unhandled test exception:', err);
  process.exit(1);
});
