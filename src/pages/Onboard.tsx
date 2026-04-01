import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users } from "lucide-react";

const Onboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-12 md:py-24 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
           <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
           <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[100px] rounded-full" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center space-y-6 mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="space-y-4">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1.5 uppercase tracking-[0.2em] font-black text-[10px] mb-4">
                  Welcome to the Future of Hiring
                </Badge>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] italic">
                  GET STARTED WITH <br />
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    OPEN TOO WORK
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
                  The definitive platform for skill-aligned career matching. Choose your path to begin.
                </p>
              </div>
            </div>

            {/* Choice Cards */}
            <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
              {/* Candidate Card */}
              <Card className="p-10 md:p-14 border-border/40 hover:border-primary/40 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-card/40 backdrop-blur-md cursor-pointer group flex flex-col h-full rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div 
                  onClick={() => navigate("/candidate/auth", { state: { returnTo } })}
                  className="flex flex-col items-center text-center space-y-8 flex-1 justify-between"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-[2rem] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                    <Users className="h-12 w-12 text-blue-600" />
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight italic uppercase">Seeker</h2>
                    <p className="text-muted-foreground text-sm md:text-base font-medium leading-relaxed">
                      Sync your expertise with verified roles. Scale your career with precision matching and direct-to-recruiter visibility.
                    </p>
                  </div>

                  <div className="space-y-3 w-full pt-6">
                    <Button 
                      size="lg" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-xl shadow-blue-600/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/candidate/auth", { state: { returnTo } });
                      }}
                    >
                      Enter Pipeline
                    </Button>
                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                       Secure &bull; Verified &bull; Free
                    </p>
                  </div>
                </div>
              </Card>

              {/* Employer Card */}
              <Card className="p-10 md:p-14 border-border/40 hover:border-emerald-400/40 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-card/40 backdrop-blur-md cursor-pointer group flex flex-col h-full rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div 
                  onClick={() => navigate("/employer/auth", { state: { returnTo } })}
                  className="flex flex-col items-center text-center space-y-8 flex-1 justify-between"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 rounded-[2rem] flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-inner">
                    <Briefcase className="h-12 w-12 text-emerald-600" />
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight italic uppercase">Recruiter</h2>
                    <p className="text-muted-foreground text-sm md:text-base font-medium leading-relaxed">
                      Deploy job openings and tap into a curated pool of battle-tested talent. Eliminate noise with skill-first evaluation.
                    </p>
                  </div>

                  <div className="space-y-3 w-full pt-6">
                    <Button 
                      size="lg" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-xl shadow-emerald-600/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/employer/auth", { state: { returnTo } });
                      }}
                    >
                      Post Opportunity
                    </Button>
                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                       Global &bull; Scalable &bull; Fast
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Alternative Option */}
            <div className="text-center space-y-4 animate-in fade-in duration-1000 delay-500">
              <p className="text-muted-foreground font-medium">
                Want to explore first?{" "}
                <Link to="/jobs" className="text-primary hover:text-primary/80 font-black uppercase tracking-widest text-xs transition-colors ml-2 underline underline-offset-4">
                  Browse open positions
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Onboard;
