import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: jobs } = await supabase.from('jobs').select('*, job_skills(*)').eq('is_active', true).limit(1);
  const { data: candidates } = await supabase.from('candidate_profiles').select('*, candidate_skills(*)').limit(1);
  
  console.log("Job skills:", jobs?.[0]?.job_skills);
  console.log("Candidate skills:", candidates?.[0]?.candidate_skills);
}
test();
