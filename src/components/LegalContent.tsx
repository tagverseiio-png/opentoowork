import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface LegalSection {
  title: string;
  icon: string;
  content: string;
}

const LegalContent = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    privacy: true,
    terms: false,
    disclaimer: false,
    safety: false,
    eeo: false,
    footer: false,
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const sections: Record<string, LegalSection> = {
    privacy: {
      title: "✅ 1. Privacy Policy",
      icon: "🔒",
      content: `Privacy Policy

Last Updated: April 2026

Open Too Work ("OpenTooWork", "we", "our", or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect information when you use https://opentoowork.tech.

1. Information We Collect

We may collect the following types of information:

- Personal details such as name, email address, phone number
- Job seeker profile information including skills, experience, resume, and preferences
- Employer information such as company name and job postings
- Technical data such as IP address, browser type, device information, and access logs

2. How We Use Your Information

We use your information to:

- Operate and maintain the OpenTooWork platform
- Match job seekers with relevant job opportunities
- Allow employers to review candidate applications
- Send job alerts, notifications, and service updates
- Improve platform functionality and user experience
- Prevent fraud, abuse, or unauthorized activity

3. Sharing of Information

We do not sell your personal data.

Information may be shared only:

- With employers when you apply to a job
- With service providers who support platform operations (hosting, email, analytics)
- When required by law or legal process

4. Data Storage & Security

We use reasonable administrative and technical safeguards to protect your data. However, no system can be guaranteed to be 100% secure.

5. Cookies & Tracking

We may use cookies or similar technologies to enhance site functionality and analyze usage trends.

6. Data Retention & Deletion

Users may update or delete their accounts at any time. 

To request account or data deletion, please contact: support@opentoowork.tech

7. Children's Privacy

OpenTooWork is not intended for individuals under the age of 18. We do not knowingly collect data from minors.

8. Changes to This Policy

We may update this Privacy Policy from time to time. Continued use of the platform indicates acceptance of the updated policy.

9. Contact

For privacy-related questions, contact: 

Email: support@opentoowork.tech`,
    },
    terms: {
      title: "✅ 2. Terms & Conditions",
      icon: "📋",
      content: `Terms & Conditions

Last Updated: April 2026

By accessing or using OpenTooWork (https://opentoowork.tech), you agree to these Terms & Conditions.

1. Platform Nature

OpenTooWork is a job discovery and job posting platform. 

We are not an employment agency, recruiter, or staffing firm, and we do not participate in hiring decisions.

2. User Eligibility

You must be at least 18 years old to use this platform.

3. User Responsibilities

You agree to:

- Provide accurate and truthful information
- Use the platform only for lawful purposes
- Not post misleading, discriminatory, or fraudulent content
- Not solicit payments from job seekers

4. Employer Responsibilities

Employers are solely responsible for:

- Accuracy of job listings
- Compliance with employment laws
- Hiring decisions and communication with candidates
- Equal Employment Opportunity (EEO) compliance

5. Account Termination

OpenTooWork reserves the right to suspend or terminate any account that violates these terms or engages in harmful activity.

6. Intellectual Property

All platform content, branding, and design are the property of OpenTooWork and may not be copied or reused without permission.

7. Limitation of Liability

OpenTooWork is not responsible for:

- Employment outcomes
- Employer or candidate conduct
- Job offer legitimacy or compensation disputes
- Financial or personal losses arising from platform use

Use of the platform is at your own risk.

8. Governing Law

These Terms are governed by the laws of the United States of America. 

Jurisdiction shall lie in the State of Delaware, USA.

9. Changes to Terms

We may update these Terms at any time. Continued use constitutes acceptance.

10. Contact

For questions regarding these Terms:

Email: support@opentoowork.tech`,
    },
    disclaimer: {
      title: "✅ 3. Disclaimer",
      icon: "⚠️",
      content: `Disclaimer

OpenTooWork is a job discovery platform only.

We do not:

- Guarantee employment or interviews
- Verify salary, benefits, visa sponsorship, or work authorization claims
- Act as an employment or recruitment agency

All job listings and employer information are provided by third parties. 

Users are responsible for independently verifying job details before applying or accepting offers.

OpenTooWork shall not be held responsible for:

- Employment decisions
- Misrepresentation by employers
- Scams or fraudulent activity by third parties
- Any losses arising from job applications or hiring outcomes`,
    },
    safety: {
      title: "✅ 4. Safety & Scam Warning",
      icon: "🛡️",
      content: `Safety & Scam Warning

Your safety is important to us.

Important Notices for Job Seekers:

- OpenTooWork never charges job seekers
- Legitimate US employers do not require fees for interviews or job offers
- Do not share bank details, OTPs, or sensitive documents

Common Scam Indicators:

- Requests for payments
- Unrealistic salary promises
- Pressure to act immediately
- Communication from unofficial email addresses

Reporting Abuse:

If you encounter suspicious activity or job listings, report them immediately.

Email: support@opentoowork.tech

Reports are confidential and used only for moderation and platform safety.`,
    },
    eeo: {
      title: "✅ 5. Equal Employment Opportunity & Anti-Discrimination",
      icon: "⚖️",
      content: `Equal Employment Opportunity (EEO)

OpenTooWork is an Equal Opportunity platform.

We do not tolerate discrimination based on:

- Race or color
- Religion
- Sex, gender identity, or sexual orientation
- National origin or citizenship
- Age, disability, or veteran status

Employers using this platform are solely responsible for complying with all applicable Equal Employment Opportunity (EEO) laws and regulations.`,
    },
    footer: {
      title: "✅ 6. Footer Legal Disclaimer",
      icon: "©️",
      content: `OpenTooWork is a job discovery platform and does not guarantee employment or hiring outcomes.`,
    },
  };

  return (
    <div className="w-full bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Legal Information</h1>
          <p className="text-lg text-muted-foreground">
            Important policies and disclaimers for using OpenTooWork
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(sections).map(([key, section]) => (
            <div
              key={key}
              className="border border-border rounded-lg bg-card hover:shadow-lg transition-shadow"
            >
              <button
                onClick={() => toggleSection(key)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">{section.icon}</span>
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                </div>
                {expandedSections[key] ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {expandedSections[key] && (
                <div className="px-6 pb-6 border-t border-border">
                  <div className="prose prose-sm dark:prose-invert max-w-none mt-4">
                    {section.content.split("\n\n").map((paragraph, idx) => (
                      <div key={idx} className="mb-4">
                        {paragraph.split("\n").map((line, lineIdx) => (
                          <div key={lineIdx} className="text-muted-foreground leading-relaxed">
                            {line.startsWith("-") ? (
                              <p className="ml-4 list-disc text-foreground">• {line.substring(1).trim()}</p>
                            ) : line.match(/^\d+\./) ? (
                              <p className="font-semibold text-foreground mt-3 mb-2">{line}</p>
                            ) : (
                              <p className="text-foreground">{line || "\u00A0"}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Last Updated:</strong> April 2026
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            For questions or concerns, please contact us at{" "}
            <a href="mailto:support@opentoowork.tech" className="text-primary hover:underline">
              support@opentoowork.tech
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegalContent;
