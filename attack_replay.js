const { createClient } = require('@supabase/supabase-js');

// Unauthenticated client using only the public anon key
const supabase = createClient(
  'https://wlcdsetmsombnzaqiofw.supabase.co',
  'sb_publishable_hW6kMOms28Yf1Pqt5fzCXQ_ofCQv1YO'
);

async function attackReplay() {
  console.log("============================================================");
  console.log("STEP 6 — DATABASE ATTACK REPLAY (unauthenticated anon key)");
  console.log("============================================================\n");

  const tables = ['projects', 'reports', 'files', 'qr_codes', 'scan_logs'];

  for (const table of tables) {
    const { data, error, status } = await supabase.from(table).select('*').limit(2);
    if (error) {
      console.log(`[BLOCKED] ${table}: ${error.message} (HTTP ${status})`);
    } else {
      console.log(`[EXPOSED] ${table}: ${data.length} rows returned (HTTP ${status})`);
      if (data.length > 0) {
        console.log(`  Sample keys: ${Object.keys(data[0]).join(', ')}`);
      }
    }
  }

  console.log("\n============================================================");
  console.log("STEP 7 — STORAGE ATTACK REPLAY (unauthenticated anon key)");
  console.log("============================================================\n");

  // Test 1: list()
  const { data: listData, error: listError } = await supabase.storage.from('project-qr-files').list();
  if (listError) {
    console.log(`[BLOCKED] storage.list(): ${listError.message}`);
  } else {
    console.log(`[EXPOSED] storage.list(): ${listData.length} items returned`);
    if (listData.length > 0) {
      console.log(`  Sample: ${listData.map(f => f.name).join(', ')}`);
    }
  }

  // Test 2: public URL fetch
  const { data: urlData } = supabase.storage.from('project-qr-files').getPublicUrl('test.pdf');
  try {
    const response = await fetch(urlData.publicUrl);
    console.log(`[${response.status >= 400 ? 'BLOCKED' : 'EXPOSED'}] Public URL fetch: HTTP ${response.status}`);
  } catch (e) {
    console.log(`[BLOCKED] Public URL fetch: ${e.message}`);
  }

  console.log("\n============================================================");
  console.log("SUMMARY");
  console.log("============================================================");
}

attackReplay();
