require('dotenv').config({ path: '.env.local' });

async function checkInsert(table) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ dummy: 'test' })
  });
  
  const text = await res.text();
  console.log(`INSERT ${table} | Status: ${res.status} | Response: ${text}`);
}

async function run() {
  await checkInsert('users');
  await checkInsert('projects');
}

run();
