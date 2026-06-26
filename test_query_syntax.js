const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// We use anon key just to mock the insert if we have no service key, but actually we need service key
// to bypass RLS. Let me just use the actual database connection if I can.
// But I don't have the real service key locally.

// Let's print out what the query structure evaluates to when run with anon key
// We already know it returns PGRST116 for test-id.
// What if we try to fetch ALL qr_codes with that select string?
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: qrs, error } = await supabase
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
      .limit(1);

  console.log("Error:", error);
  console.log("Data:", JSON.stringify(qrs, null, 2));
}

run();
