import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cwwbxlpjsbtbqdeelpcc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3d2J4bHBqc2J0YnFkZWVscGNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODY2OTUyOSwiZXhwIjoyMTA0MjQ1NTI5fQ.4q79Y-guz5WUcd028kPUgjm-0qWLUc658UYZPz52leo';

async function testSupabase() {
  console.log('Testing live Supabase connection to:', supabaseUrl);
  const client = createClient(supabaseUrl, serviceRoleKey);
  
  // Test query
  const { data, error } = await client.from('organizations').select('*').limit(1);
  if (error) {
    console.log('Query result: Table might not exist yet (needs migration SQL). Error code:', error.code, 'Message:', error.message);
  } else {
    console.log('Query SUCCESS! Connected to Supabase tables. Data:', data);
  }
}

testSupabase().catch(console.error);
