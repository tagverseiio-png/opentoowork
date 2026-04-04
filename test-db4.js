import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const envFile = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(envFile.split('\n').filter(l=>l).map(l=>l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: cands } = await supabase.from('candidate_profiles')
    .select('*, profiles!inner(*), candidate_skills(*)');
  for (const c of cands) {
      console.log(c.profiles.full_name, c.candidate_skills.slice(0, 5).map(s => `${s.skill_name}:${s.years_experience}`));
  }
}
test();
