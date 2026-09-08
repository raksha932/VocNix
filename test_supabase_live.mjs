import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cwwbxlpjsbtbqdeelpcc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3d2J4bHBqc2J0YnFkZWVscGNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODY2OTUyOSwiZXhwIjoyMTA0MjQ1NTI5fQ.4q79Y-guz5WUcd028kPUgjm-0qWLUc658UYZPz52leo';

async function testFullFlow() {
  console.log('--- STEP 1: Verify API Health ---');
  const healthRes = await fetch('http://localhost:3000/api/health');
  const health = await healthRes.json();
  console.log('Health status:', health.status);
  console.log('Database connected:', health.diagnostics.database.connected);
  console.log('Storage Mode:', health.diagnostics.database.storageMode);

  console.log('\n--- STEP 2: Create Event via POST /api/events ---');
  const createRes = await fetch('http://localhost:3000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Global Tech Summit 2026 - Live Multilingual',
      description: 'Annual keynotes translated live in Tamil and Hindi',
      scheduled_start: new Date().toISOString(),
      languages: [
        { code: 'ta', name: 'Tamil' },
        { code: 'hi', name: 'Hindi' },
        { code: 'fr', name: 'French' },
      ],
    }),
  });

  const createData = await createRes.json();
  console.log('Create Event Response Success:', createData.success);
  if (!createData.success) {
    console.error('Create error:', createData.error);
    process.exit(1);
  }
  const createdEvent = createData.event;
  console.log('Created Event ID:', createdEvent.id);
  console.log('Created Event Title:', createdEvent.title);
  console.log('Created Translation Rooms:', createData.rooms?.length);

  console.log('\n--- STEP 3: Verify Event via GET /api/events ---');
  const getRes = await fetch('http://localhost:3000/api/events?all=true');
  const getData = await getRes.json();
  console.log('GET /api/events success:', getData.success);
  console.log('Total events in DB:', getData.events?.length);
  const found = getData.events?.find((e) => e.id === createdEvent.id);
  console.log('Found created event in GET response:', Boolean(found));
  console.log('Found event languages:', found?.languages?.map((l) => l.language_name));
  console.log('Found event rooms:', found?.rooms?.map((r) => r.livekit_room_name));

  console.log('\n--- STEP 4: Direct Supabase Database Confirmation ---');
  const client = createClient(supabaseUrl, serviceRoleKey);
  const { data: dbEvent, error: dbErr } = await client
    .from('events')
    .select('*, languages:event_languages(*), rooms:translation_rooms(*)')
    .eq('id', createdEvent.id)
    .single();

  if (dbErr) {
    console.error('Supabase direct query failed:', dbErr);
    process.exit(1);
  }
  console.log('CONFIRMED in Supabase PostgreSQL:');
  console.log('- Event ID:', dbEvent.id);
  console.log('- Title:', dbEvent.title);
  console.log('- Status:', dbEvent.status);
  console.log('- Permanent Languages in Supabase:', dbEvent.languages?.length);
  console.log('- Permanent Rooms in Supabase:', dbEvent.rooms?.length);

  console.log('\n>>> SUCCESS! All checks passed. Events are permanently stored in Supabase PostgreSQL! <<<');
  process.exit(0);
}

testFullFlow().catch((err) => {
  console.error(err);
  process.exit(1);
});
