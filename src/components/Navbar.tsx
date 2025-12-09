import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LogOut, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define role type locally if not exported from lib/supabase
type UserRole = 'candidate' | 'employer' | 'admin';

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // If session is lost (e.g. token expired or storage cleared), update state immediately
      if (!session) {
        setUserRole(null);
      }
      checkUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    
    setUserRole(data?.role as UserRole);
    setLoading(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setUserRole(null);
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account."
      });
      navigate("/");
    }
  };

  // Helper to render links based on role to avoid duplication
  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => {
    const linkClass = mobile ? "w-full justify-start" : "";
    const variant = mobile ? "ghost" : "ghost";

    return (
      <>
        {/* --- ADMIN LINKS --- */}
        {userRole === 'admin' && (
          <>
            <Link to="/about" className={mobile ? "w-full" : ""}>
              <Button variant={variant} className={linkClass}>About</Button>
            </Link>
            <Link to="/dashboard" className={mobile ? "w-full" : ""}>
              <Button variant={variant} className={linkClass}>Dashboard</Button>
            </Link>
          </>
        )}

        {/* --- CANDIDATE LINKS --- */}
        {userRole === 'candidate' && (
          <>
            <Link to="/jobs" className={mobile ? "w-full" : ""}>
              <Button variant={variant} className={linkClass}>Find Jobs</Button>
            </Link>
            <Link to="/about" className={mobile ? "w-full" : ""}>
              <Button variant={variant} className={linkClass}>About</Button>
            </Link>
            <Link to="/dashboard" className={mobile ? "w-full" : ""}>
              <Button variant={variant} className={linkClass}>Dashboard</Button>
            </Link>
          </>
        )}

        {/* --- EMPLOYER LINKS --- */}
        {userRole === 'employer' && (
          <>
            <Link to="/jobs" className={mobile ? "w-full" : ""}>
              <Button variant={variant} className={linkClass}>View Jobs</Button>
            </Link>
            <Link to="/about" className={mobile ? "w-full" : ""}>
              <Button variant={variant} className={linkClass}>About</Button>
            </Link>
            <Link to="/dashboard" className={mobile ? "w-full" : ""}>
              <Button variant={variant} className={linkClass}>Dashboard</Button>
            </Link>
          </>
        )}

        {/* --- GUEST LINKS --- */}
        {!userRole && (
          <>
            <Link to="/jobs" className={mobile ? "w-full" : ""}>
              <Button variant={variant} className={linkClass}>Find Jobs</Button>
            </Link>
            <Link to="/about" className={mobile ? "w-full" : ""}>
              <Button variant={variant} className={linkClass}>About</Button>
            </Link>
            <Link to="/candidate/auth" className={mobile ? "w-full" : ""}>
              <Button variant="ghost" className={`${linkClass} text-muted-foreground hover:text-primary`}>
                For Candidates
              </Button>
            </Link>
            <Link to="/employer/auth" className={mobile ? "w-full" : ""}>
              <Button variant="ghost" className={`${linkClass} text-muted-foreground hover:text-primary`}>
                For Employer
              </Button>
            </Link>
            <Link to="/onboard" className={mobile ? "w-full" : ""}>
              <Button className={`bg-gradient-to-r from-primary to-accent text-white shadow-md hover:opacity-90 ${linkClass}`}>
                Get Started
              </Button>
            </Link>
          </>
        )}
      </>
    );
  };

  if (loading) return <nav className="border-b border-border/40 h-16 bg-background/95 backdrop-blur-md" />;

  return (
    <nav className="border-b border-border/40 bg-background/95 sticky top-0 z-50 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/assets/opentoowork-icon1-BZ2bbVrF.png"
              alt="Open Too Work Logo"
              className="h-10 w-10 object-contain transition-transform group-hover:scale-110"
            />
            <span className="text-xl font-bold text-primary tracking-wide hidden sm:block">
              Open Too Work
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <NavLinks />
            {userRole && (
              <Button onClick={handleSignOut} variant="outline" size="icon" className="ml-2" title="Sign Out">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                <div className="flex flex-col gap-2">
                  <NavLinks mobile />
                  {userRole && (
                    <>
                      <div className="h-px bg-border my-1" />
                      <Button 
                        onClick={handleSignOut} 
                        variant="ghost" 
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;