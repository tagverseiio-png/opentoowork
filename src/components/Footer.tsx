import { Link } from "react-router-dom";
import { Briefcase, Facebook, Linkedin, Twitter, Instagram, Mail } from "lucide-react";
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
  const hasContact = content?.contact_email;

  return (
    <footer className="bg-background border-t border-border/50 pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Adaptive Layout: Flex wrapping with space-between handles missing columns gracefully */}
        <div className="flex flex-wrap justify-between gap-10 md:gap-8 mb-12">
          
          {/* 1. Brand Section */}
          <div className="space-y-6 max-w-xs w-full md:w-auto">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md group-hover:shadow-primary/20 transition-all">
                <img src="/favicon.ico" alt="Logo" className="w-full h-full object-cover p-1.5" />
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
              <li>
                <Link to="/admin/auth" className="text-muted-foreground hover:text-primary transition-colors">
                  Admin Portal
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
        <div className="pt-8 border-t border-border/50">
          <div className="flex items-center justify-center sm:justify-end gap-3 mb-6 pr-0 sm:pr-4">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest bg-muted/20 px-4 py-2 rounded-full border border-border/50">
               Developed by <span className="text-primary font-black ml-1.5 tracking-tighter">Tagverse</span>
            </span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Open Too Work. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;