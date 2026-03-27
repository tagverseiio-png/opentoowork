import { useEffect, useState } from "react";
import { Shield, Zap, Users, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

const defaultFeatures = [
  {
    title: "Secure & Trusted",
    description: "All employers are verified. Your data and applications are protected with strong security."
  },
  {
    title: "Quick Apply",
    description: "Apply to multiple job openings with a single click — fast and smart hiring process."
  },
  {
    title: "Skill-Based Matching",
    description: "We match candidates to roles based on skills and experience — no complex eligibility guesswork."
  },
  {
    title: "Career Growth",
    description: "Work with top U.S. companies and start building your professional journey with confidence."
  }
];

const WhyChooseUs = ({ sectionKey = "homepage_why_choose_us" }: { sectionKey?: string } = {}) => {
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
        .maybeSingle();

      if (data?.content) {
        setContent(data.content);
      } else {
        setContent({ title: "Why Choose OPENTOOWORK?", subtitle: "A platform designed to help skilled talent build a successful career in the United States", items: defaultFeatures });
      }
    } catch (err) {
      console.error("Error fetching Why Choose Us content:", err);
      setContent({ title: "Why Choose OPENTOOWORK?", subtitle: "A platform designed to help skilled talent build a successful career in the United States", items: defaultFeatures });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const title = content?.title || "Why Choose OPENTOOWORK?";
  const subtitle = content?.subtitle || "A platform designed to help skilled talent build a successful career in the United States";
  const items = content?.items || defaultFeatures;

  return (
    <section className="py-20 bg-gradient-to-b from-background to-primary-light/20">
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
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((feature: any, index: number) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card border-border/50"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                <span className="h-7 w-7 text-primary-foreground font-bold flex items-center justify-center">{index + 1}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
