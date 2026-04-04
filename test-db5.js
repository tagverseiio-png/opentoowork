import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const envFile = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(envFile.split('\n').filter(l=>l).map(l=>l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: employer } = await supabase.from('employer_profiles').select('*').ilike('company_name', '%strucureo%').single();
  const { data: jobs } = await supabase.from('jobs').select('*, job_skills(*)').eq('employer_id', employer?.id || null);
  console.log(JSON.stringify(jobs?.map(j=>({title: j.title, active: j.is_active, skills: j.job_skills})), null, 2));
}
test();
