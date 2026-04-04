import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const envFile = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(envFile.split('\n').filter(l=>l).map(l=>l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

function normalizeSkillName(name) {
  return name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^a-z0-9.#+\- \/]/g, '');
}

function calculateMatchScore(candidateSkills, jobSkills) {
  if (!candidateSkills?.length || !jobSkills?.length) return 0;
  const reqSkills = jobSkills.filter(s => s.is_required !== false);
  const optSkills = jobSkills.filter(s => s.is_required === false);
  if (reqSkills.length === 0 && optSkills.length === 0) return 0;
  const W_REQ = 0.8, W_OPT = 0.2, EXP_CAP = 1.2;
  let score = 0;
  if (reqSkills.length > 0) {
    let reqScore = 0;
    for (const js of reqSkills) {
      const normalizedJobSkill = normalizeSkillName(js.skill_name);
      const match = candidateSkills.find(cs => normalizeSkillName(cs.skill_name) === normalizedJobSkill);
      if (match) {
        const expRatio = Math.min(match.years_experience / Math.max(js.years_experience, 1), EXP_CAP);
        reqScore += expRatio;
      }
    }
    score += (reqScore / reqSkills.length) * W_REQ * 100;
  }
  return score;
}

async function test() {
  const { data: employer } = await supabase.from('employer_profiles').select('*').ilike('company_name', '%strucureo%').single();
  const { data: jobs } = await supabase.from('jobs').select('*, job_skills(*)').eq('employer_id', employer?.id).eq('is_active', true);
  
  const { data: cands } = await supabase.from('candidate_profiles')
    .select('*, profiles!inner(*), candidate_skills(*)');
    
  for (const c of cands) {
      if (c.profiles.full_name === 'Vijay sree' || c.profiles.full_name === 'Lance') {
         const score = Math.max(...jobs.map(job => calculateMatchScore(c.candidate_skills, job.job_skills)));
         console.log(c.profiles.full_name, score, "%");
      }
  }
}
test();
