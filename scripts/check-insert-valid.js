require('dotenv').config({ path: '.env.local' });

async function checkInsert(table, body) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  });
  
  const text = await res.text();
  console.log(`INSERT ${table} | Status: ${res.status} | Response: ${text}`);
}

async function run() {
  await checkInsert('users', { email: 'test@test.com' });
  await checkInsert('projects', { machine_name: 'test' });
  await checkInsert('reports', { status: 'pass' });
  await checkInsert('files', { file_name: 'test.pdf' });
}

run();
