import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EditableSection from "@/components/EditableSection";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const Policy = () => {
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
        .eq("section_key", "policy_page");

      if (data && data.length > 0) {
        setContent(data[0].content || {});
      } else {
        setContent({
          policy_title: "Privacy Policy",
          policy_body: getDefaultPolicyContent()
        });
      }
    } catch (err) {
      console.error("Error fetching content:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPolicyContent = () => `
Privacy Policy

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

Email: support@opentoowork.tech`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const policyTitle = content?.policy_title || "Privacy Policy";
  const policyBody = content?.policy_body || getDefaultPolicyContent();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <EditableSection
          sectionKey="policy_page"
          content={content}
          userRole={userRole}
          onSave={(newContent) => setContent(newContent)}
        >
          <section className="py-20 bg-primary/5 border-t border-primary/10">
            <div className="max-w-4xl mx-auto px-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-8">{policyTitle}</h1>
              
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                {policyBody?.split('\n\n').map((paragraph, idx) => (
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

export default Policy;
