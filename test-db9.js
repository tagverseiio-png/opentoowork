export function normalizeSkillName(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9.#+\- \/]/g, '');
}

export function calculateMatchScore(
  candidateSkills,
  jobSkills,
  candidateTitle,
  jobTitle,
) {
  if (!candidateSkills.length || !jobSkills.length) return 0;

  const reqSkills = jobSkills.filter(s => s.is_required !== false);
  const optSkills = jobSkills.filter(s => s.is_required === false);

  if (reqSkills.length === 0 && optSkills.length === 0) return 0;

  const W_REQ = 0.8;
  const W_OPT = 0.2;
  const EXP_CAP = 1.2;

  let score = 0;

  // ── Required Skills (weighted 80%) ──
  if (reqSkills.length > 0) {
    let reqScore = 0;
    for (const js of reqSkills) {
      const normalizedJobSkill = normalizeSkillName(js.skill_name);
      const match = candidateSkills.find(
        cs => normalizeSkillName(cs.skill_name) === normalizedJobSkill
      );
      if (match) {
        const expRatio = Math.min(
          match.years_experience / Math.max(js.years_experience, 1),
          EXP_CAP
        );
        reqScore += expRatio;
      }
    }
    score += (reqScore / reqSkills.length) * W_REQ * 100;
  } else {
    score += W_REQ * 100;
  }

  // ── Optional Skills (weighted 20%) ──
  if (optSkills.length > 0) {
    let optScore = 0;
    for (const js of optSkills) {
      const normalizedJobSkill = normalizeSkillName(js.skill_name);
      const match = candidateSkills.find(
        cs => normalizeSkillName(cs.skill_name) === normalizedJobSkill
      );
      if (match) optScore += 1;
    }
    score += (optScore / optSkills.length) * W_OPT * 100;
  }

  // ── Job Title Alignment (Multiplier) ──
  if (candidateTitle && jobTitle) {
    const cWords = candidateTitle.toLowerCase().match(/\b(\w+)\b/g) || [];
    const jWords = jobTitle.toLowerCase().match(/\b(\w+)\b/g) || [];
    const matchesTitle = cWords.some(w => jWords.includes(w));
    
    if (matchesTitle) {
      score = (score * 0.5) + 50; 
    } else {
      score = score * 0.5; 
    }
  }

  return Math.min(Math.round(score), 100);
}

const cSkills = [{skill_name: 'Python', years_experience: 1}];
const jSkills = [{skill_name: 'Python', years_experience: 1, is_required: true}];
const cTitle = "PYTHON DEVELOPER";
const jTitle = "AI Dev";

console.log(calculateMatchScore(cSkills, jSkills, cTitle, jTitle));
