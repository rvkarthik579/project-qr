const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // I added this earlier!
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: qrs, error: listError } = await supabase.from('qr_codes').select('qr_unique_id').limit(1);
  if (!qrs || qrs.length === 0) {
    console.log("No QR codes found in DB!");
    return;
  }
  
  const validId = qrs[0].qr_unique_id;
  console.log("Found valid ID:", validId);

  const { data: qr, error: qrError } = await supabase
      .from('qr_codes')
      .select(`
        id, qr_unique_id, password_hash, expiry_date, next_inspection_date,
        show_company, show_uploader_name, show_next_inspection, is_active,
        failed_pin_attempts, locked_until,
        files(id, file_name, file_path, file_size, file_type,
          reports(id, status, remarks, created_at, project_id,
            projects(machine_name, user_id,
              users(name, company_name)
            )
          )
        )
      `)
      .eq('qr_unique_id', validId)
      .single();

  console.log("Error fetching single:", qrError);
  console.log("Data fetched:", qr ? "YES" : "NO");
}
run();
