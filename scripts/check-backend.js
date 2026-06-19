const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function check() {
  const tables = ['users', 'projects', 'reports', 'files', 'qr_codes', 'scan_logs']
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    if (error) {
      console.log(`❌ ${table}:`, error)
    } else {
      console.log(`✅ ${table}: exists, ${count} rows`)
    }
  }
}

check()
