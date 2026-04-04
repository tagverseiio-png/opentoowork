import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const envFile = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(envFile.split('\n').filter(l=>l).map(l=>l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: employers } = await supabase.from('employer_profiles').select('*').ilike('company_name', '%strucureo%');
  for (const emp of employers) {
     const { data: jobs } = await supabase.from('jobs').select('*, job_skills(*)').eq('employer_id', emp.id).eq('is_active', true);
     console.log(emp.company_name, "JOBS:", jobs.map(j => ({title: j.title, skills: j.job_skills.map(s => s.skill_name)})));
  }
}
test();
