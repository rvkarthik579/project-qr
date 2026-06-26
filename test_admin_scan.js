const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const qrUniqueId = 'test-id';
  console.log("1. QR Unique ID:", qrUniqueId);
  console.log("URL encoded inside QR: https://projectqr.app/scan/" + qrUniqueId);
  console.log("API Route handled: /api/qr/scan/" + qrUniqueId);

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
    .eq('qr_unique_id', qrUniqueId)
    .single();

  if (qrError) {
    console.log("Supabase Error:", qrError);
  } else {
    console.log("Supabase QR Record Exists:", !!qr);
    console.log("Raw QR Data:", JSON.stringify(qr, null, 2));
    
    const file = qr.files;
    const report = Array.isArray(file?.reports) ? file.reports[0] : file?.reports;
    const project = Array.isArray(report?.projects) ? report.projects[0] : report?.projects;
    const user = Array.isArray(project?.users) ? project.users[0] : project?.users;
    
    console.log("\nExtracted Mapping:");
    console.log("File:", !!file);
    console.log("Report:", !!report);
    console.log("Project:", !!project);
    console.log("User:", !!user);
  }
  
  // Also try local API route if server is running
  try {
    const response = await fetch(`http://localhost:3000/api/qr/scan/${qrUniqueId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    console.log("\nLocal API Route Response Status:", response.status);
    const json = await response.json();
    console.log("Local API Route Response:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.log("Local API not running or error:", err.message);
  }
}

run();
