const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase.storage.from('project-qr-files').createSignedUrl('', 300);
    console.log("Data:", data);
    console.log("Error:", error);
  } catch(e) {
    console.error("Exception:", e);
  }
}
run();
