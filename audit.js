const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://wlcdsetmsombnzaqiofw.supabase.co', 'sb_publishable_hW6kMOms28Yf1Pqt5fzCXQ_ofCQv1YO');

async function run() {
  console.log("TEST 1 & 2: Querying tables without auth...");
  const tables = ['projects', 'reports', 'files', 'qr_codes', 'scan_logs'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log(`Table ${table}: `, error ? `FAIL: ${error.message}` : `PASS (Data: ${data.length} rows)`);
  }
}
run();
