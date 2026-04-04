export function normalizeSkillName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9.#+\- \/]/g, '');
}
export function calculateMatchScore(
  candidateSkills: any[],
  jobSkills: any[],
  candidateTitle?: string | null,
  jobTitle?: string | null,
): number {
  if (!candidateSkills.length || !jobSkills.length) return 0;

  const reqSkills = jobSkills.filter(s => s.is_required !== false);
  const optSkills = jobSkills.filter(s => s.is_required === false);

  if (reqSkills.length === 0 && optSkills.length === 0) return 0;
  let score = 0;

  if (reqSkills.length > 0) {
    let reqScore = 0;
    for (const js of reqSkills) {
      const normalizedJobSkill = normalizeSkillName(js.skill_name);
      const match = candidateSkills.find(cs => normalizeSkillName(cs.skill_name) === normalizedJobSkill);
      if (match) {
        const expRatio = Math.min(match.years_experience / Math.max(js.years_experience, 1), 1.2);
        reqScore += expRatio;
      }
    }
    score += (reqScore / reqSkills.length) * 0.8 * 100;
  }
  return score;
}

const candidateSkills = [
  { skill_name: "JAVASCRIPT", years_experience: 5 },
  { skill_name: "JAVA", years_experience: 5 }
];
const jobSkills = [
  { skill_name: "JAVA", years_experience: 3, is_required: true }
];
console.log(calculateMatchScore(candidateSkills, jobSkills, "JAVA DEVO", "JAVA DEV"));
