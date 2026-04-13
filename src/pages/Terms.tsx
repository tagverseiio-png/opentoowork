import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EditableSection from "@/components/EditableSection";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const Terms = () => {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUserRole(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    setUserRole(data?.role);
  };

  const fetchContent = async () => {
    try {
      const { data } = await supabase
        .from("site_content")
        .select("section_key, content")
        .eq("section_key", "terms_page");

      if (data && data.length > 0) {
        setContent(data[0].content || {});
      } else {
        setContent({
          terms_title: "Terms & Conditions",
          terms_body: getDefaultTermsContent()
        });
      }
    } catch (err) {
      console.error("Error fetching content:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTermsContent = () => `
Terms & Conditions

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

Email: support@opentoowork.tech`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const termsTitle = content?.terms_title || "Terms & Conditions";
  const termsBody = content?.terms_body || getDefaultTermsContent();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <EditableSection
          sectionKey="terms_page"
          content={content}
          userRole={userRole}
          onSave={(newContent) => setContent(newContent)}
        >
          <section className="py-20 bg-primary/5 border-t border-primary/10">
            <div className="max-w-4xl mx-auto px-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-8">{termsTitle}</h1>
              
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                {termsBody?.split('\n\n').map((paragraph, idx) => (
                  <div key={idx} className="mb-6">
                    {paragraph.split('\n').map((line, lineIdx) => {
                      if (line.startsWith('-')) {
                        return (
                          <p key={lineIdx} className="ml-4 text-foreground">
                            • {line.substring(1).trim()}
                          </p>
                        );
                      }
                      if (line.match(/^\d+\./)) {
                        return (
                          <h3 key={lineIdx} className="font-semibold text-lg text-foreground mt-4 mb-2">
                            {line}
                          </h3>
                        );
                      }
                      return (
                        <p key={lineIdx} className="text-foreground leading-relaxed">
                          {line || '\u00A0'}
                        </p>
                      );
                    })}
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
          </section>
        </EditableSection>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
