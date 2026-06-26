const { createClient } = require('@supabase/supabase-js');

// Using the exact anon key from .env.local
const supabase = createClient(
  'https://wlcdsetmsombnzaqiofw.supabase.co', 
  'sb_publishable_hW6kMOms28Yf1Pqt5fzCXQ_ofCQv1YO'
);

async function runTest() {
  const tables = ['projects', 'reports', 'files', 'qr_codes', 'scan_logs'];
  
  for (const table of tables) {
    console.log(`\n======================================================`);
    console.log(`TESTING TABLE: ${table}`);
    console.log(`QUERY EXECUTED: supabase.from('${table}').select('*')`);
    console.log(`======================================================`);
    
    // Attempting query
    const { data, error, status, statusText } = await supabase.from(table).select('*').limit(2);
    
    if (error) {
      console.log(`STATUS: ERROR`);
      console.log(`ERROR RESPONSE:`, JSON.stringify(error, null, 2));
    } else {
      console.log(`STATUS: SUCCESS (HTTP ${status} ${statusText})`);
      console.log(`ROW COUNT RETURNED: ${data.length}`);
      console.log(`EXACT RESPONSE DATA:`, JSON.stringify(data, null, 2));
    }
  }
}

runTest();
