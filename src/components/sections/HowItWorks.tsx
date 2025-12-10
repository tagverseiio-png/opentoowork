import { useEffect, useState } from "react";
import { UserPlus, Search, FileText, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const defaultSteps = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Sign up in minutes and showcase your skills & experience to employers."
  },
  {
    icon: Search,
    title: "Find Jobs",
    description: "Search roles that match your skills, location, and career goals."
  },
  {
    icon: FileText,
    title: "Apply Easily",
    description: "Submit applications quickly using your saved professional profile."
  },
  {
    icon: CheckCircle,
    title: "Get Hired",
    description: "Get discovered by recruiters, track progress, and land the right job."
  }
];

const HowItWorks = ({ sectionKey = "homepage_how_it_works" }: { sectionKey?: string } = {}) => {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [sectionKey]);

  const fetchContent = async () => {
    try {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", sectionKey)
        .single();

      if (data?.content) {
        setContent(data.content);
      } else {
        setContent({ title: "How It Works", subtitle: "Your path to amazing opportunities starts here", steps: defaultSteps });
      }
    } catch (err) {
      console.error("Error fetching How It Works content:", err);
      setContent({ title: "How It Works", subtitle: "Your path to amazing opportunities starts here", steps: defaultSteps });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const title = content?.title || "How It Works";
  const subtitle = content?.subtitle || "Your path to amazing opportunities starts here";
  const steps = content?.steps || defaultSteps;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">{title}</h2>
          <div className={`text-lg text-muted-foreground max-w-2xl mx-auto space-y-4 ${
            subtitle?.length > 100 ? 'text-justify' : 'text-center'
          }`}>
            {subtitle?.split('\n').map((line: string, idx: number) => (
              line.trim() === '' ? (
                <div key={idx} className="h-2" />
              ) : (
                <p key={idx} className="whitespace-pre-wrap">{line}</p>
              )
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 max-w-6xl mx-auto">
          {steps.map((step: any, index: number) => {
            const IconComponent = step.icon || (index === 0 ? UserPlus : index === 1 ? Search : index === 2 ? FileText : CheckCircle);
            return (
            <div key={index} className="relative text-center">
              {/* Connecting Line (Desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 right-[-50%] w-[100%] h-1 bg-gradient-to-r from-primary/40 to-accent/40" />
              )}

              <div className="mx-auto flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <IconComponent className="h-12 w-12 text-primary-foreground" />
                  </div>
                  <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                    {step.number || index + 1}
                  </span>
                </div>

                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-sm max-w-[250px]">{step.description}</p>
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
