const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wlcdsetmsombnzaqiofw.supabase.co',
  'sb_publishable_hW6kMOms28Yf1Pqt5fzCXQ_ofCQv1YO'
);

async function run() {
  const { data: files, error: filesError } = await supabase.from('files').select('*').limit(1);
  const { data: reports, error: reportsError } = await supabase.from('reports').select('*').limit(1);
  const { data: qr, error: qrError } = await supabase.from('qr_codes').select('*').limit(1);
  const { data: storage, error: storageError } = await supabase.storage.from('project-qr-files').list();

  console.log("1. files result:");
  console.log(JSON.stringify({ data: files, error: filesError }, null, 2));
  
  console.log("\n2. reports result:");
  console.log(JSON.stringify({ data: reports, error: reportsError }, null, 2));
  
  console.log("\n3. qr_codes result:");
  console.log(JSON.stringify({ data: qr, error: qrError }, null, 2));
  
  console.log("\n4. storage.list result:");
  console.log(JSON.stringify({ data: storage, error: storageError }, null, 2));
}

run();
