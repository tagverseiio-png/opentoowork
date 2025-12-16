import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EditableSection from "@/components/EditableSection";
import { supabase } from "@/lib/supabase";
import { Mail, MapPin, Loader2, Edit } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const About = () => {
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
        .in("section_key", ["about_hero_section", "about_why_choose_us", "about_how_it_works", "about_mission_section", "about_contact_section"]);

      if (data) {
        const contentMap: any = {};
        data.forEach((item) => {
          contentMap[item.section_key] = item.content;
        });
        setContent(contentMap);
      }
    } catch (err) {
      console.error("Error fetching content:", err);
    } finally {
      setLoading(false);
    }
  };

  const aboutPage = content.about_hero_section || {
    hero_title: "About Open Too Work",
    hero_description: "Open Too Work connects talented professionals with meaningful career opportunities across the United States."
  };

  const contactSection = content.about_contact_section || {
    contact_email: "",
    contact_phone: "",
    contact_address: ""
  };

  const whyChooseUs = content.about_why_choose_us || {
    title: "Why Choose OPENTOOWORK?",
    subtitle: "A platform designed to help skilled talent build a successful career in the United States",
    items: [
      { title: "Secure & Trusted", description: "All employers are verified. Your data and applications are protected with strong security." },
      { title: "Quick Apply", description: "Apply to multiple job openings with a single click — fast and smart hiring process." },
      { title: "Skill-Based Matching", description: "We match candidates to roles based on skills and experience — no complex eligibility guesswork." },
      { title: "Career Growth", description: "Work with top U.S. companies and start building your professional journey with confidence." }
    ]
  };

  const howItWorks = content.about_how_it_works || {
    title: "How It Works",
    subtitle: "Your path to amazing opportunities starts here",
    steps: [
      { number: 1, title: "Create Your Profile", description: "Sign up in minutes and showcase your skills & experience to employers." },
      { number: 2, title: "Find Jobs", description: "Search roles that match your skills, location, and career goals." },
      { number: 3, title: "Apply Easily", description: "Submit applications quickly using your saved professional profile." },
      { number: 4, title: "Get Hired", description: "Get discovered by recruiters, track progress, and land the right job." }
    ]
  };

  const missionContent = content.about_mission_section || {
    mission_title: "Our Mission",
    mission_body: "We believe every skilled candidate deserves access to opportunities that match their ambitions."
  };
  const missionTitle = missionContent?.mission_title || "Our Mission";
  const missionBody = missionContent?.mission_body || "We believe every skilled candidate deserves access to opportunities that match their ambitions.";
  
  const heroTitle = aboutPage?.hero_title || "About Open Too Work";
  const heroDesc = aboutPage?.hero_description || "Open Too Work connects talented professionals with meaningful career opportunities across the United States.";

  // Check if any contact info exists
  const showContact = contactSection?.contact_email || contactSection?.contact_address;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* About Header - Separate Edit Button */}
        <div className="relative group">
          <EditableSection
            sectionKey="about_hero_section"
            content={aboutPage}
            userRole={userRole}
            onSave={(newContent) => setContent({ ...content, about_hero_section: newContent })}
          >
            <header className="relative py-24 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
              <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {heroTitle}
                  </h1>
                  <div className={`text-lg md:text-xl text-foreground/80 leading-relaxed space-y-4 ${
                    heroDesc?.length > 100 ? 'text-justify' : 'text-center'
                  }`}>
                    {heroDesc?.split('\n').map((line: string, idx: number) => (
                      line.trim() === '' ? (
                        <div key={idx} className="h-4" />
                      ) : (
                        <p key={idx} className="whitespace-pre-wrap">{line}</p>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </header>
          </EditableSection>
        </div>

        {/* Why Choose Us Section - Separate Edit Button */}
        <EditableSection
          sectionKey="about_why_choose_us"
          content={whyChooseUs}
          userRole={userRole}
          onSave={(newContent) => setContent({ ...content, about_why_choose_us: newContent })}
        >
          {whyChooseUs.items && whyChooseUs.items.length > 0 && (
            <section className="py-24 bg-gradient-to-b from-background to-primary-light/20">
              <div className="container mx-auto px-4">
                <div className="text-center mb-16 space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold">{whyChooseUs.title}</h2>
                  <div className="text-lg text-muted-foreground max-w-2xl mx-auto space-y-4">
                    {whyChooseUs.subtitle?.split('\n').map((line: string, idx: number) => (
                      line.trim() === '' ? (
                        <div key={idx} className="h-2" />
                      ) : (
                        <p key={idx} className="whitespace-pre-wrap">{line}</p>
                      )
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                  {whyChooseUs.items.map((item: any, idx: number) => (
                    <Card key={idx} className="p-8 border-border/50 hover:border-primary/20 transition-all hover:shadow-lg bg-card/50 backdrop-blur-sm hover:-translate-y-2">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                        <span className="text-primary-foreground font-bold flex items-center justify-center">{idx + 1}</span>
                      </div>
                      <h3 className="font-semibold text-xl mb-3">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.description || item.desc}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}
        </EditableSection>

        {/* Our Mission Section - Separate Edit Button */}
        <EditableSection
          sectionKey="about_mission_section"
          content={{ mission_title: missionTitle, mission_body: missionBody }}
          userRole={userRole}
          onSave={(newContent) => {
            setContent({ 
              ...content, 
              about_mission_section: newContent 
            });
          }}
        >
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">{missionTitle}</h2>
                <div className={`text-lg text-foreground leading-relaxed space-y-4 ${
                  missionBody?.length > 100 ? 'text-justify' : 'text-center'
                }`}>
                  {missionBody?.split('\n').map((line: string, idx: number) => (
                    line.trim() === '' ? (
                      <div key={idx} className="h-4" />
                    ) : (
                      <p key={idx} className="whitespace-pre-wrap">{line}</p>
                    )
                  ))}
                </div>
              </div>
            </div>
          </section>
        </EditableSection>

        {/* How It Works Section - Separate Edit Button */}
        <EditableSection
          sectionKey="about_how_it_works"
          content={howItWorks}
          userRole={userRole}
          onSave={(newContent) => setContent({ ...content, about_how_it_works: newContent })}
        >
          {howItWorks.steps && howItWorks.steps.length > 0 && (
            <section className="py-24 bg-muted/20">
              <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold mb-4">{howItWorks.title}</h2>
                  <div className={`text-xl text-muted-foreground space-y-4 ${
                    howItWorks.subtitle?.length > 100 ? 'text-justify max-w-2xl mx-auto' : 'text-center'
                  }`}>
                    {howItWorks.subtitle?.split('\n').map((line: string, idx: number) => (
                      line.trim() === '' ? (
                        <div key={idx} className="h-2" />
                      ) : (
                        <p key={idx} className="whitespace-pre-wrap">{line}</p>
                      )
                    ))}
                  </div>
                </div>
                <div className="max-w-6xl mx-auto">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {howItWorks.steps.map((step: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold shadow-lg mb-4">
                            {step.number}
                          </div>
                          <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                        {idx < howItWorks.steps.length - 1 && (
                          <div className="hidden lg:block absolute top-8 -right-8 w-16 h-1 bg-gradient-to-r from-primary/50 to-transparent"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </EditableSection>

        {/* Get in Touch Section - Separate Edit Button */}
        <EditableSection
          sectionKey="about_contact_section"
          content={contactSection}
          userRole={userRole}
          onSave={(newContent) => setContent({ ...content, about_contact_section: newContent })}
        >
          {showContact && (
            <section className="py-24 bg-muted/30">
              <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                  <h2 className="text-3xl font-bold mb-12 text-center">Get in Touch</h2>
                  
                  <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                    {contactSection?.contact_email && (
                      <div className="flex flex-col items-center text-center p-6 bg-background rounded-2xl shadow-sm border border-border/50 min-w-[280px] flex-1 md:flex-none max-w-sm hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                          <Mail className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold mb-2">Email Us</h3>
                        <a href={`mailto:${contactSection.contact_email}`} className="text-muted-foreground hover:text-primary transition-colors">
                          {contactSection.contact_email}
                        </a>
                      </div>
                    )}

                    {contactSection?.contact_address && (
                      <div className="flex flex-col items-center text-center p-6 bg-background rounded-2xl shadow-sm border border-border/50 min-w-[280px] flex-1 md:flex-none max-w-sm hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                          <MapPin className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold mb-2">Visit Us</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap max-w-[250px]">
                          {contactSection.contact_address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </EditableSection>

        <section className="py-20 bg-primary/5 border-t border-primary/10">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to start your journey?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-lg">
              Join thousands of professionals finding their dream jobs today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/onboard" className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-primary/25">
                Get Started Now
              </a>
              <a href="/jobs" className="inline-flex items-center justify-center px-8 py-4 rounded-lg border border-border bg-background hover:bg-accent text-foreground font-semibold transition-colors">
                Browse Open Roles
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
