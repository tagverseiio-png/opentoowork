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
import { NotificationBell } from "./NotificationBell";

// Define role type locally if not exported from lib/supabase
type UserRole = 'candidate' | 'employer' | 'admin';

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // If session is lost (e.g. token expired or storage cleared), update state immediately
      if (!session) {
        setUserRole(null);
        setUserEmail(null);
      }
      checkUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUserRole(null);
      setUserEmail(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    
    setUserRole(data?.role as UserRole);
    setUserEmail(session.user.email || null);
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
      setUserEmail(null);
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
              <Button variant="ghost" className={`${linkClass} text-foreground hover:text-white font-semibold`}>
                For Candidates
              </Button>
            </Link>
            <Link to="/employer/auth" className={mobile ? "w-full" : ""}>
              <Button variant="ghost" className={`${linkClass} text-foreground hover:text-white font-semibold`}>
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
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md group-hover:shadow-primary/20 transition-all">
              <img src="/favicon.ico" alt="Logo" className="w-full h-full object-cover p-1.5" />
            </div>
            <span className="text-xl font-bold text-primary tracking-wide hidden sm:block">
              Open Too Work
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <NavLinks />
            {userRole && (
              <div className="flex items-center gap-2 border-l border-border/40 pl-4 ml-2">
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 border-border/40 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all duration-300" title="Sign Out">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-xs text-muted-foreground">Signed in as</p>
                      <p className="text-sm font-medium truncate">{userEmail}</p>
                    </div>
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
                      <div className="px-2 py-2 border-b border-border mb-2">
                        <p className="text-xs text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-medium truncate">{userEmail}</p>
                      </div>
                      <div className="h-px bg-border my-1" />
                      <div className="px-2 py-4 flex items-center justify-between bg-primary/5 rounded-xl mb-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alert Protocols</span>
                         <NotificationBell />
                      </div>
                      <Button 
                        onClick={handleSignOut} 
                        variant="ghost" 
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 font-black uppercase tracking-widest text-[10px]"
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