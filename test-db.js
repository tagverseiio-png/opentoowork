import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(envFile.split('\n').filter(l=>l).map(l=>l.split('=')));

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: jobs } = await supabase.from('jobs').select('*, job_skills(*)').eq('is_active', true);
  console.log(JSON.stringify(jobs.map(j => ({title: j.title, skills: j.job_skills})), null, 2));
}
test();
