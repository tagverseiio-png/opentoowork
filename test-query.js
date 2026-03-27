import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('candidate_profiles').select('*, profiles!inner(*), candidate_skills(*)').limit(1);
  console.log(JSON.stringify({data, error}, null, 2));
}
test();
