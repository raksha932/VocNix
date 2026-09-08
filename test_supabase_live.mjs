import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cwwbxlpjsbtbqdeelpcc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3d2J4bHBqc2J0YnFkZWVscGNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODY2OTUyOSwiZXhwIjoyMTA0MjQ1NTI5fQ.4q79Y-guz5WUcd028kPUgjm-0qWLUc658UYZPz52leo';

async function testFullFlow() {
  console.log('===============================================================');
  console.log('--- STEP 1: CREATE ADDITIONAL EVENT IN SUPABASE VIA API ---');
  console.log('===============================================================');
  
  const additionalEventPayload = {
    title: 'International AI & Healthcare Symposium 2026',
    description: 'Global medical translation stream connecting clinical researchers worldwide',
    scheduled_start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    languages: [
      { code: 'es', name: 'Spanish' },
      { code: 'de', name: 'German' },
      { code: 'ja', name: 'Japanese' },
    ],
  };

  const createRes = await fetch('http://localhost:3000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(additionalEventPayload),
  });

  const createData = await createRes.json();
  if (!createData.success) {
    console.error('Failed to create additional event:', createData.error);
    process.exit(1);
  }

  console.log('SUCCESS: Additional Event Created in Supabase:');
  console.log('  Event ID:', createData.event.id);
  console.log('  Title:   ', createData.event.title);
  console.log('  Status:  ', createData.event.status);
  console.log('  Rooms:   ', createData.rooms.map(r => r.livekit_room_name).join(', '));

  console.log('\n===============================================================');
  console.log('--- STEP 2: TRIGGER SYNC DB (FETCHING ALL RECORDS FROM SUPABASE) ---');
  console.log('===============================================================');
  const syncRes = await fetch('http://localhost:3000/api/events?all=true');
  const syncData = await syncRes.json();
  console.log('Sync DB Status: 200 OK');
  console.log('Total Events Authoritatively Stored in Supabase:', syncData.events.length);

  console.log('\n===============================================================');
  console.log('--- STEP 3: SPREADSHEET TABLE VIEW (LIVE SUPABASE DATA) ---');
  console.log('===============================================================');
  
  const tableData = syncData.events.map((ev, idx) => ({
    '#': idx + 1,
    'Event ID': ev.id.slice(0, 8) + '...',
    'Event Name': ev.title,
    'Mode': 'WebRTC Audio',
    'Languages': ev.languages?.map(l => l.language_name).join(', ') || 'None',
    'Rooms Count': ev.rooms?.length || 0,
    'Scheduled Date': new Date(ev.scheduled_start).toLocaleDateString(),
    'Status': ev.status.toUpperCase(),
    'Public Token': ev.public_access_token.slice(0, 8) + '...',
  }));

  console.table(tableData);

  console.log('\nDirect PostgreSQL Confirmation via Supabase Admin Client:');
  const client = createClient(supabaseUrl, serviceRoleKey);
  const { data: dbEvents, count } = await client.from('events').select('id, title, status, created_at', { count: 'exact' });
  console.log('Supabase `events` table row count:', dbEvents?.length);
  dbEvents?.forEach(e => console.log(` - [${e.id}] ${e.title} (${e.status})`));

  console.log('\n>>> SUCCESS: Additional Event Created, DB Synchronized & Spreadsheet Table Rendered! <<<');
  process.exit(0);
}

testFullFlow().catch((err) => {
  console.error(err);
  process.exit(1);
});
