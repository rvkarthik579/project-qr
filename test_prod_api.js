const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wlcdsetmsombnzaqiofw.supabase.co',
  'sb_publishable_hW6kMOms28Yf1Pqt5fzCXQ_ofCQv1YO'
);

async function run() {
  const { data } = await supabase.from('qr_codes').select('qr_unique_id').limit(1);
  if (data && data.length > 0) {
    const qrId = data[0].qr_unique_id;
    console.log("Found QR ID:", qrId);

    console.log("\nTesting PROD Scan API:");
    const response = await fetch(`https://project-qr-xi.vercel.app/api/qr/scan/${qrId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    console.log("Scan API Status:", response.status);
    const json = await response.json();
    console.log("Scan API Response:", JSON.stringify(json, null, 2));
  }
}
run();
