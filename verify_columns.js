const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://wlcdsetmsombnzaqiofw.supabase.co', 'sb_publishable_hW6kMOms28Yf1Pqt5fzCXQ_ofCQv1YO');

async function verifyColumns() {
  console.log("=== COLUMN EXISTENCE VERIFICATION ===\n");

  // 1. Verify reports.user_id exists
  const { data: r, error: re } = await supabase.from('reports').select('user_id').limit(1);
  console.log("reports.user_id:", re ? `ERROR: ${re.message}` : `EXISTS (sample: ${JSON.stringify(r?.[0]?.user_id)})`);

  // 2. Verify qr_codes.user_id exists
  const { data: q, error: qe } = await supabase.from('qr_codes').select('user_id').limit(1);
  console.log("qr_codes.user_id:", qe ? `ERROR: ${qe.message}` : `EXISTS (sample: ${JSON.stringify(q?.[0]?.user_id)})`);

  // 3. Verify files.report_id exists (for JOIN to reports)
  const { data: f, error: fe } = await supabase.from('files').select('report_id').limit(1);
  console.log("files.report_id:", fe ? `ERROR: ${fe.message}` : `EXISTS (sample: ${JSON.stringify(f?.[0]?.report_id)})`);

  // 4. Verify scan_logs.qr_id exists (for JOIN to qr_codes)
  const { data: s, error: se } = await supabase.from('scan_logs').select('qr_id').limit(1);
  console.log("scan_logs.qr_id:", se ? `ERROR: ${se.message}` : `EXISTS (sample: ${JSON.stringify(s?.[0]?.qr_id)})`);

  // 5. Verify files does NOT have user_id (confirming JOIN is needed)
  const { data: fu, error: fue } = await supabase.from('files').select('user_id').limit(1);
  console.log("files.user_id:", fue ? `DOES NOT EXIST (expected): ${fue.message}` : `WARNING: EXISTS (sample: ${JSON.stringify(fu?.[0]?.user_id)})`);

  // 6. Verify scan_logs does NOT have user_id (confirming JOIN is needed)
  const { data: su, error: sue } = await supabase.from('scan_logs').select('user_id').limit(1);
  console.log("scan_logs.user_id:", sue ? `DOES NOT EXIST (expected): ${sue.message}` : `WARNING: EXISTS (sample: ${JSON.stringify(su?.[0]?.user_id)})`);

  // 7. Verify qr_codes.failed_pin_attempts and locked_until exist
  const { data: qa, error: qae } = await supabase.from('qr_codes').select('failed_pin_attempts, locked_until').limit(1);
  console.log("qr_codes.failed_pin_attempts:", qae ? `ERROR: ${qae.message}` : `EXISTS (sample: ${JSON.stringify(qa?.[0]?.failed_pin_attempts)})`);
  console.log("qr_codes.locked_until:", qae ? `ERROR: ${qae.message}` : `EXISTS (sample: ${JSON.stringify(qa?.[0]?.locked_until)})`);
}

verifyColumns();
