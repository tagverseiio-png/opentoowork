// OpenToWork Email API Configuration
const API_URL = 'https://opentoowork-email-api.vercel.app/api/send-email';
const API_KEY = import.meta.env.VITE_EMAIL_API_KEY || 'test-api-key-123';

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends an email using the OpenToWork Email API.
 * From: verify@opentoowork.tech (handled by API server)
 */
export async function sendEmail({ to, subject, html, text }: EmailParams) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to, subject, html, text: text || '' })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Email request failed');
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error occurred while sending email:', error.message);
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
  <div class="header"><h1>OpenToWork</h1></div>
  <div class="body">${body}</div>
  <div class="footer"><p>Sent from verify@opentoowork.tech &bull; OpenToWork Platform</p></div>
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
      <p style="margin-top:24px;font-size:12px;color:#71717a;">Keep your profile and resume up-to-date to improve your match score.</p>
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
      <p style="margin-top:24px;font-size:12px;color:#71717a;">Tip: Use the ATS pipeline to shortlist or schedule interviews.</p>
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
// Math-based Candidate Match Score Calculator (reusable)
// Uses weighted scoring: Required skills 80%, Optional skills 20%
// Experience ratio capped at 1.2× for over-qualified bonus
// Formula: score = Σ(matched_req × min(cExpYrs/jExpYrs, 1.2)) / totalReq × 0.8 × 100
//        + Σ(matched_opt) / totalOpt × 0.2 × 100
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
): number {
  if (!candidateSkills.length || !jobSkills.length) return 0;

  const reqSkills = jobSkills.filter(s => s.is_required !== false);
  const optSkills = jobSkills.filter(s => s.is_required === false);

  if (reqSkills.length === 0 && optSkills.length === 0) return 0;

  const W_REQ = 0.8;
  const W_OPT = 0.2;
  const EXP_CAP = 1.2; // max bonus multiplier for exceeding required experience

  let score = 0;

  // ── Required Skills (weighted 80%) ──
  if (reqSkills.length > 0) {
    let reqScore = 0;
    for (const js of reqSkills) {
      const match = candidateSkills.find(
        cs => cs.skill_name.toLowerCase() === js.skill_name.toLowerCase()
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
    score += W_REQ * 100; // no required skills → full weight awarded
  }

  // ── Optional Skills (weighted 20%) ──
  if (optSkills.length > 0) {
    let optScore = 0;
    for (const js of optSkills) {
      const match = candidateSkills.find(
        cs => cs.skill_name.toLowerCase() === js.skill_name.toLowerCase()
      );
      if (match) optScore += 1;
    }
    score += (optScore / optSkills.length) * W_OPT * 100;
  }

  return Math.min(Math.round(score), 100);
}
