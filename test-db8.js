import { calculateMatchScore } from './src/lib/email.js';

const cSkills = [{skill_name: 'Python', years_experience: 1}];
const jSkills = [{skill_name: 'Python', years_experience: 1, is_required: true}];
const cTitle = "PYTHON DEVELOPER";
const jTitle = "AI Dev";

console.log(calculateMatchScore(cSkills, jSkills, cTitle, jTitle));
