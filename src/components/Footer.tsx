import { Link } from "react-router-dom";
import { Briefcase, Facebook, Linkedin, Twitter, Instagram, Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const Footer = () => {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "about_page")
        .single();
      
      if (data?.content) {
        setContent(data.content);
      }
    };
    fetchContent();
  }, []);

  const hasSocials = content?.social_linkedin || content?.social_twitter || content?.social_facebook || content?.social_instagram;
  const hasContact = content?.contact_email || content?.contact_phone;

  return (
    <footer className="bg-background border-t border-border/50 pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Adaptive Layout: Flex wrapping with space-between handles missing columns gracefully */}
        <div className="flex flex-wrap justify-between gap-10 md:gap-8 mb-12">
          
          {/* 1. Brand Section */}
          <div className="space-y-6 max-w-xs w-full md:w-auto">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">
                Open Too Work
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              {content?.hero_description || "Connecting skilled professionals with top employers across the United States. Your next career move starts here."}
            </p>
          </div>

          {/* 2. Platform Links */}
          <div className="min-w-[140px]">
            <h4 className="font-semibold text-foreground mb-6">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/jobs" className="text-muted-foreground hover:text-primary transition-colors">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/employer/auth" className="text-muted-foreground hover:text-primary transition-colors">
                  For Employers
                </Link>
              </li>
              <li>
                <Link to="/candidate/auth" className="text-muted-foreground hover:text-primary transition-colors">
                  For Candidates
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Contact (Conditional) */}
          {hasContact && (
            <div className="min-w-[200px]">
              <h4 className="font-semibold text-foreground mb-6">Contact</h4>
              <ul className="space-y-3 text-sm">
                {content?.contact_email && (
                  <li>
                    <a href={`mailto:${content.contact_email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Mail className="h-4 w-4" /> {content.contact_email}
                    </a>
                  </li>
                )}
                
                {content?.contact_phone && (
                  <li>
                    <a href={`tel:${content.contact_phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="h-4 w-4" /> {content.contact_phone}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* 4. Social Media (Conditional) */}
          {hasSocials && (
            <div className="min-w-[140px]">
              <h4 className="font-semibold text-foreground mb-6">Follow Us</h4>
              <div className="flex gap-3">
                {content.social_linkedin && (
                  <a 
                    href={content.social_linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary flex items-center justify-center transition-all text-muted-foreground"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                
                {content.social_twitter && (
                  <a 
                    href={content.social_twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary flex items-center justify-center transition-all text-muted-foreground"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                
                {content.social_facebook && (
                  <a 
                    href={content.social_facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary flex items-center justify-center transition-all text-muted-foreground"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                
                {content.social_instagram && (
                  <a 
                    href={content.social_instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary flex items-center justify-center transition-all text-muted-foreground"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground space-y-4">
          <p>© {new Date().getFullYear()} Open Too Work. All rights reserved.</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm">Developed by:</span>
            <img src="/devLogo.png" alt="Developer Logo" className="h-20" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;