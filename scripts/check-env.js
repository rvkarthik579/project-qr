require('dotenv').config({ path: '.env.local' });
console.log('ENV KEYS:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('DATABASE') || k.includes('URL')));
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'EXISTS' : 'NO');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'EXISTS' : 'NO');
