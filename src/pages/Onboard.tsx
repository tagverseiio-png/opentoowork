import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, Users } from "lucide-react";

const Onboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center space-y-8 mb-16">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Get Started with Open Too Work
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                  Choose how you want to engage with our platform
                </p>
              </div>
            </div>

            {/* Choice Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
              {/* Candidate Card */}
              <Card className="p-8 md:p-12 border-border/50 hover:border-primary/50 transition-all hover:shadow-lg bg-card/50 backdrop-blur-sm cursor-pointer group">
                <div 
                  onClick={() => navigate("/candidate/auth")}
                  className="flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="h-10 w-10 text-blue-600" />
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-2xl md:text-3xl font-bold">For Candidates</h2>
                    <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                      Create your profile, explore amazing job opportunities, and take the next step in your career.
                    </p>
                  </div>

                  <div className="space-y-2 w-full pt-4">
                    <Button 
                      size="lg" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                      onClick={() => navigate("/candidate/auth")}
                    >
                      Continue as Candidate
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Looking for your dream job? Start here.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Employer Card */}
              <Card className="p-8 md:p-12 border-border/50 hover:border-primary/50 transition-all hover:shadow-lg bg-card/50 backdrop-blur-sm cursor-pointer group">
                <div 
                  onClick={() => navigate("/employer/auth")}
                  className="flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Briefcase className="h-10 w-10 text-emerald-600" />
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-2xl md:text-3xl font-bold">For Employers</h2>
                    <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                      Post job openings, discover top talent, and build your winning team with ease.
                    </p>
                  </div>

                  <div className="space-y-2 w-full pt-4">
                    <Button 
                      size="lg" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      onClick={() => navigate("/employer/auth")}
                    >
                      Continue as Employer
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Looking for talented professionals? Start here.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Alternative Option */}
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Want to explore first?{" "}
                <a href="/jobs" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  Browse open positions
                </a>
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
