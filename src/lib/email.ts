// ═══════════════════════════════════════════════════════════════
// Brevo (Sendinblue) Transactional Email API
// Docs: https://developers.brevo.com/reference/sendtransacemail
// ═══════════════════════════════════════════════════════════════
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || '';

const SENDER = {
  name: 'opentoowork',
  email: 'support@opentoowork.tech',
};

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends a transactional email using the Brevo SMTP API.
 */
export async function sendEmail({ to, subject, html, text }: EmailParams) {
  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text || subject || 'opentoowork Notification',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Brevo email request failed');
    }

    console.log('Brevo email sent successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending email via Brevo:', error.message);
    return { success: false, error: error.message };
  }
}

// ─── Shared HTML wrapper ───────────────────────────────────────
const wrap = (body: string) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<style>
  body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;color:#18181b;}
  .container{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;}
  .header{background:linear-gradient(135deg,#18181b 0%,#27272a 100%);padding:32px 40px;text-align:center;}
  .header h1{margin:0;color:#fff;font-size:20px;font-weight:900;letter-spacing:2px;text-transform:uppercase;}
  .body{padding:40px;}
  .body h2{font-size:22px;font-weight:800;margin:0 0 8px;color:#18181b;}
  .body p{font-size:14px;line-height:1.7;color:#52525b;margin:0 0 16px;}
  .badge{display:inline-block;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:800;padding:4px 12px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;}
  .footer{padding:24px 40px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;}
  .footer p{font-size:10px;color:#a1a1aa;margin:0;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;}
</style>
</head><body>
<div class="container">
  <div class="header"><h1>opentoowork</h1></div>
  <div class="body">${body}</div>
  <div class="footer"><p>Sent from support@opentoowork.tech &bull; opentoowork Platform</p></div>
</div>
</body></html>`;

// ═══════════════════════════════════════════════════════════════
// 1. APPLICATION CONFIRMATION — sent to the Candidate
// ═══════════════════════════════════════════════════════════════
export function sendApplicationConfirmation(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  companyName: string,
) {
  return sendEmail({
    to: candidateEmail,
    subject: `Application Confirmed – ${jobTitle}`,
    html: wrap(`
      <h2>Application Submitted!</h2>
      <p>Hi <strong>${candidateName}</strong>,</p>
      <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been received.
         The employer will review your profile and you'll be notified about any status updates.</p>
      <p><span class="badge">Status: Applied</span></p>
      <p style="margin-top:24px;font-size:12px;color:#71717a;">Keep your profile and resume up-to-date to improve your match score on opentoowork.</p>
    `),
  });
}

// ═══════════════════════════════════════════════════════════════
// 2. EMPLOYER ALERT — sent when a candidate applies
// ═══════════════════════════════════════════════════════════════
export function sendEmployerNewApplicantAlert(
  employerEmail: string,
  candidateName: string,
  jobTitle: string,
) {
  return sendEmail({
    to: employerEmail,
    subject: `New Applicant for ${jobTitle}`,
    html: wrap(`
      <h2>New Application Received</h2>
      <p><strong>${candidateName}</strong> has applied for your job posting: <strong>${jobTitle}</strong>.</p>
      <p>Log in to your Employer Dashboard to review the candidate's profile, resume, and skill alignment.</p>
      <p style="margin-top:24px;font-size:12px;color:#71717a;">Tip: Use the opentoowork ATS pipeline to shortlist or schedule interviews.</p>
    `),
  });
}

// ═══════════════════════════════════════════════════════════════
// 3. APPLICATION STATUS CHANGE — sent to Candidate
// ═══════════════════════════════════════════════════════════════
export function sendStatusChangeNotification(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  newStatus: string,
) {
  const statusDisplay = newStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return sendEmail({
    to: candidateEmail,
    subject: `Application Update – ${jobTitle}`,
    html: wrap(`
      <h2>Status Update</h2>
      <p>Hi <strong>${candidateName}</strong>,</p>
      <p>Your application for <strong>${jobTitle}</strong> has been updated.</p>
      <p><span class="badge">${statusDisplay}</span></p>
      <p>Check your Candidate Dashboard for full details.</p>
    `),
  });
}

// ═══════════════════════════════════════════════════════════════
// 4. JOB ALERT EMAIL — sent to candidates matching criteria
// ═══════════════════════════════════════════════════════════════
export function sendJobAlertEmail(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  companyName: string,
  jobLocation: string,
  jobId: string,
) {
  return sendEmail({
    to: candidateEmail,
    subject: `New Job Match: ${jobTitle} at ${companyName}`,
    html: wrap(`
      <h2>A New Role Matches Your Profile</h2>
      <p>Hi <strong>${candidateName}</strong>,</p>
      <p>We found a new job that aligns with your skills and preferences:</p>
      <p style="font-size:18px;font-weight:800;margin:16px 0 4px;">${jobTitle}</p>
      <p style="color:#52525b;">${companyName} &bull; ${jobLocation}</p>
      <p><a href="https://opentoowork.tech/jobs/${jobId}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 28px;border-radius:8px;font-size:12px;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:1px;margin-top:8px;">View &amp; Apply</a></p>
    `),
  });
}

// ═══════════════════════════════════════════════════════════════
// 5. REFERRAL EMAIL — sent to the referred friend
// ═══════════════════════════════════════════════════════════════
export function sendReferralEmail(
  toEmail: string,
  referrerName: string,
  jobTitle: string,
  companyName: string,
  jobId: string,
) {
  return sendEmail({
    to: toEmail,
    subject: `Opportunity: ${referrerName} referred you to ${jobTitle}`,
    html: wrap(`
      <h2>You've Been Referred!</h2>
      <p>Hi there,</p>
      <p><strong>${referrerName}</strong> thought you'd be a great fit for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
      <p>Click the link below to view the job details and apply directly:</p>
      <p><a href="https://opentoowork.tech/jobs/${jobId}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 28px;border-radius:8px;font-size:12px;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:1px;margin-top:8px;">View Job &amp; Apply</a></p>
      <p style="margin-top:24px;font-size:12px;color:#71717a;">Join opentoowork to find more opportunities matching your skills.</p>
    `),
  });
}

// ═══════════════════════════════════════════════════════════════
// Skill Name Normalizer — trims whitespace, lowercases,
// collapses multiple spaces, strips special chars at edges
// ═══════════════════════════════════════════════════════════════
export function normalizeSkillName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')           // collapse multiple spaces
    .replace(/[^a-z0-9.#+\- /]/g, ''); // keep alphanumeric + common skill chars
}

const TITLE_STOP_WORDS = new Set([
  "a", "an", "and", "for", "in", "of", "on", "the", "to", "with",
  "jr", "junior", "sr", "senior", "lead", "principal", "staff",
  "engineer", "developer", "specialist", "manager", "architect", "analyst"
]);

const normalizeTitleToken = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const tokenizeTitle = (value?: string | null): string[] => {
  if (!value) return [];
  return value
    .split(/\s+/)
    .map(normalizeTitleToken)
    .filter((token) => token.length > 1 && !TITLE_STOP_WORDS.has(token));
};

export function calculateJobTitleMatchScore(
  candidateTitle?: string | null,
  jobTitle?: string | null,
): number {
  const candidateTokens = tokenizeTitle(candidateTitle);
  const jobTokens = tokenizeTitle(jobTitle);

  if (!candidateTokens.length || !jobTokens.length) return 0;

  const candidateSet = new Set(candidateTokens);
  const jobSet = new Set(jobTokens);

  let overlap = 0;
  for (const token of candidateSet) {
    if (jobSet.has(token)) overlap += 1;
  }

  if (!overlap) return 0;

  const precision = overlap / candidateSet.size;
  const recall = overlap / jobSet.size;
  const f1 = (2 * precision * recall) / (precision + recall);

  return Math.round(Math.min(1, f1) * 100);
}

// ═══════════════════════════════════════════════════════════════
// Math-based Candidate Match Score Calculator (reusable)
// Uses weighted scoring: Required skills 80%, Optional skills 20%
// Experience ratio capped at 1.2× for over-qualified bonus
// ═══════════════════════════════════════════════════════════════
export interface SkillRecord {
  skill_name: string;
  years_experience: number;
  is_required?: boolean;
  skill_level?: string;
}

export function calculateMatchScore(
  candidateSkills: SkillRecord[],
  jobSkills: SkillRecord[],
  candidateTitle?: string | null,
  jobTitle?: string | null,
): number {
  let score = 0;

  let matchesTitle = false;
  if (candidateTitle && jobTitle) {
    const candidateTokens = tokenizeTitle(candidateTitle);
    const jobTokens = tokenizeTitle(jobTitle);
    
    if (candidateTokens.length > 0 && jobTokens.length > 0) {
      const jobSet = new Set(jobTokens);
      matchesTitle = candidateTokens.some(token => jobSet.has(token));
    }
  }

  // Fallback: If candidate specifies no skills, evaluate strictly on Title match
  if (!candidateSkills || candidateSkills.length === 0) {
    return matchesTitle ? 50 : 0;
  }

  // Check for any skill overlap between candidate and job skills
  let hasSkillOverlap = false;
  if (jobSkills && jobSkills.length > 0) {
    hasSkillOverlap = jobSkills.some(js => 
      candidateSkills.some(cs => 
        normalizeSkillName(cs.skill_name) === normalizeSkillName(js.skill_name)
      )
    );
  }

  // If job has no specific skills required: only give a baseline score if title matches
  // Otherwise, require skill overlap or return 0
  if (!jobSkills || jobSkills.length === 0) {
    return matchesTitle ? 50 : 0;
  }

  const reqSkills = jobSkills.filter(s => s.is_required !== false);
  const optSkills = jobSkills.filter(s => s.is_required === false);

  const W_REQ = 0.8;
  const W_OPT = 0.2;
  const EXP_CAP = 1.2;

  // ── Required Skills (weighted 80%) ──
  let reqScore = 0;
  if (reqSkills.length > 0) {
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
  let optScore = 0;
  if (optSkills.length > 0) {
    for (const js of optSkills) {
      const normalizedJobSkill = normalizeSkillName(js.skill_name);
      const match = candidateSkills.find(
        cs => normalizeSkillName(cs.skill_name) === normalizedJobSkill
      );
      if (match) optScore += 1;
    }
    score += (optScore / optSkills.length) * W_OPT * 100;
  } else {
    score += W_OPT * 100;
  }

  // Final Composite Score Calculation
  // Title alignment is weighted at 30%, explicitly verified skills at 70%
  const SKILL_WEIGHT = 0.70;
  const TITLE_WEIGHT = 0.30;
  
  let finalScore = score * SKILL_WEIGHT;
  if (matchesTitle) {
    finalScore += (100 * TITLE_WEIGHT);
  }

  return Math.min(Math.round(finalScore), 100);
}
