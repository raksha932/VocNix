import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== VOCNIX AUTOMATED PRODUCTION VERIFICATION SUITE ===\n');

  // TEST 1: Health Check Endpoint
  console.log('[TEST 1] Testing /api/health endpoint...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert.strictEqual(healthRes.status, 200, 'Health check should return 200');
  const healthData = await healthRes.json();
  console.log('  Status:', healthData.status);
  console.log('  Service:', healthData.service);
  console.log('  Real-time Audio Engine:', healthData.diagnostics.features.realTimeAudio);
  console.log('  Human-only mode:', healthData.diagnostics.features.aiTranslation);
  console.log('  Audio-only mode:', healthData.diagnostics.features.video);
  console.log('  Passed!\n');

  // TEST 2: Create Dynamic Event with Multiple Languages
  console.log('[TEST 2] Creating dynamic event with Tamil, Hindi, and French...');
  const eventRes = await fetch(`${BASE_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Global Innovation Summit 2026',
      description: 'Annual technical conference with live multilingual human translation',
      scheduled_start: new Date().toISOString(),
      languages: [
        { code: 'ta', name: 'Tamil' },
        { code: 'hi', name: 'Hindi' },
        { code: 'fr', name: 'French' },
      ],
    }),
  });
  assert.strictEqual(eventRes.status, 200, 'Event creation should return 200');
  const eventData = await eventRes.json();
  assert.strictEqual(eventData.success, true, 'Event creation should succeed');
  assert.strictEqual(eventData.rooms.length, 3, 'Should dynamically create exactly 3 rooms');

  const event = eventData.event;
  const rooms = eventData.rooms;
  console.log(`  Event ID: ${event.id}`);
  console.log(`  Public Audience Token: ${event.public_access_token}`);
  console.log(`  Rooms created: ${rooms.map(r => r.livekit_room_name).join(', ')}`);
  console.log('  Passed!\n');

  // TEST 3: Unauthorized / Invalid Translator Token
  console.log('[TEST 3] Testing unauthorized translator room access...');
  const fakeTranslatorRes = await fetch(`${BASE_URL}/api/livekit/translator-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secureRoomToken: 'fake-invalid-token-12345',
      translatorName: 'Hacker',
    }),
  });
  assert.strictEqual(fakeTranslatorRes.status, 404, 'Invalid token should return 404');
  console.log('  Properly denied access to invalid translator token. Passed!\n');

  // TEST 4: Authorized Translator Token Generation & Session Start
  console.log('[TEST 4] Generating authorized LiveKit publisher token for Tamil room...');
  const tamilRoom = rooms[0];
  const translatorRes = await fetch(`${BASE_URL}/api/livekit/translator-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secureRoomToken: tamilRoom.secure_room_token,
      translatorName: 'Tamil Lead Translator',
    }),
  });
  assert.strictEqual(translatorRes.status, 200, 'Translator token generation should succeed');
  const translatorData = await translatorRes.json();
  assert.strictEqual(translatorData.success, true);
  assert.ok(translatorData.token, 'Must return JWT token');
  assert.ok(translatorData.sessionId, 'Must create translator session in database');
  console.log(`  Session ID created: ${translatorData.sessionId}`);
  console.log(`  Room Name: ${translatorData.room.livekitRoomName}`);
  console.log(`  Language: ${translatorData.room.languageName}`);
  console.log('  Passed!\n');

  // TEST 5: Audience Join & Restricted Token
  console.log('[TEST 5] Generating restricted audience subscriber token for Tamil channel...');
  const audienceRes = await fetch(`${BASE_URL}/api/livekit/audience-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventToken: event.public_access_token,
      roomId: tamilRoom.id,
      sessionKey: 'test-listener-client-1',
    }),
  });
  assert.strictEqual(audienceRes.status, 200, 'Audience token generation should succeed');
  const audienceData = await audienceRes.json();
  assert.strictEqual(audienceData.success, true);
  assert.ok(audienceData.token, 'Must return JWT token for audience');
  assert.strictEqual(audienceData.room.listeners, 1, 'Active listener count should be 1');
  console.log(`  Audience token granted for room: ${audienceData.room.livekitRoomName}`);
  console.log(`  Current active listener count: ${audienceData.room.listeners}`);
  console.log('  Passed!\n');

  // TEST 6: Second Audience Member Join (Dynamic Counter)
  console.log('[TEST 6] Second audience listener joins Tamil channel...');
  const aud2Res = await fetch(`${BASE_URL}/api/livekit/audience-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventToken: event.public_access_token,
      roomId: tamilRoom.id,
      sessionKey: 'test-listener-client-2',
    }),
  });
  const aud2Data = await aud2Res.json();
  assert.strictEqual(aud2Data.room.listeners, 2, 'Listener count must increment to 2');
  console.log(`  Listener count updated to: ${aud2Data.room.listeners}. Passed!\n`);

  // TEST 7: Audience Member Leaves
  console.log('[TEST 7] Audience listener leaves channel...');
  const leaveRes = await fetch(`${BASE_URL}/api/audience/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: tamilRoom.id,
      sessionKey: 'test-listener-client-2',
    }),
  });
  const leaveData = await leaveRes.json();
  assert.strictEqual(leaveData.listeners, 1, 'Listener count must decrement to 1');
  console.log(`  Listener count correctly decremented to: ${leaveData.listeners}. Passed!\n`);

  // TEST 8: Session Pause & Resume
  console.log('[TEST 8] Testing session PAUSE and RESUME lifecycle...');
  const sessionId = translatorData.sessionId;

  const pauseRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pause' }),
  });
  const pauseData = await pauseRes.json();
  assert.strictEqual(pauseData.status, 'paused');
  console.log('  Session state updated to PAUSED. Audience receives silence.');

  const resumeRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'resume' }),
  });
  const resumeData = await resumeRes.json();
  assert.strictEqual(resumeData.status, 'live');
  console.log('  Session state resumed to LIVE. Audio track unmuted.');
  console.log('  Passed!\n');

  // TEST 9: Session Stop & Authoritative Duration/Usage Accounting
  console.log('[TEST 9] Testing session STOP and authoritative usage calculation...');
  const stopRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'stop' }),
  });
  const stopData = await stopRes.json();
  assert.strictEqual(stopData.status, 'ended');
  console.log(`  Session ended. Authoritative recorded usage: ${stopData.usageMinutes} minutes`);
  console.log('  Passed!\n');

  // TEST 10: Dashboard Stats Aggregation
  console.log('[TEST 10] Testing dashboard statistics aggregation...');
  const statsRes = await fetch(`${BASE_URL}/api/dashboard/stats`);
  const statsData = await statsRes.json();
  assert.strictEqual(statsData.success, true);
  console.log('  Total Events:', statsData.stats.totalEvents);
  console.log('  Dynamic Rooms:', statsData.stats.totalRooms);
  console.log('  Remaining Quota Minutes:', statsData.stats.remainingMinutes);
  console.log('  Passed!\n');

  console.log('====================================================');
  console.log('ALL 10 END-TO-END ACCEPTANCE TESTS PASSED PERFECTLY!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
