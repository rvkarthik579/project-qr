require('dotenv').config({ path: '.env.local' });

async function checkTable(table) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`;
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    }
  });
  
  const text = await res.text();
  console.log(`Table: ${table} | Status: ${res.status} | Response: ${text}`);
}

async function run() {
  await checkTable('users');
  await checkTable('projects');
  await checkTable('reports');
  await checkTable('files');
}

run();
