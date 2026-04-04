import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const envFile = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(envFile.split('\n').filter(l=>l).map(l=>l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
import { normalizeSkillName, calculateMatchScore } from './src/lib/email.js';

async function test() {
  const { data: employer } = await supabase.from('employer_profiles').select('*').ilike('company_name', '%strucureo%').single();
  const { data: jobs } = await supabase.from('jobs').select('*, job_skills(*)').eq('employer_id', employer?.id).eq('is_active', true);
  
  const { data: cands } = await supabase.from('candidate_profiles')
    .select('*, profiles!inner(*), candidate_skills(*)');
    
  for (const c of cands) {
      if (c.profiles.full_name === 'Vijay sree' || c.profiles.full_name === 'Lance') {
         const score = Math.max(...jobs.map(job => calculateMatchScore(c.candidate_skills, job.job_skills, c.desired_job_title, job.title)));
         console.log(c.profiles.full_name, score, "%");
      }
  }
}
test();
