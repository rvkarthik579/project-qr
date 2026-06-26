const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://wlcdsetmsombnzaqiofw.supabase.co', 'sb_publishable_hW6kMOms28Yf1Pqt5fzCXQ_ofCQv1YO');

async function run() {
  console.log("TEST 3: Storage Security");
  const { data } = await supabase.storage.from('project-qr-files').getPublicUrl('test.pdf');
  console.log('Public URL generated:', data.publicUrl);
  
  try {
    const response = await fetch(data.publicUrl);
    console.log('Public URL Fetch Status:', response.status);
    
    // Also try to list files in the bucket
    const { data: listData, error } = await supabase.storage.from('project-qr-files').list();
    console.log('List Bucket Error:', error ? error.message : 'SUCCESS');
  } catch (e) {
    console.log('Fetch error:', e.message);
  }
}
run();
