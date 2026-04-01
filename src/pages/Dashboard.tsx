import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import CandidateDashboard from "@/components/CandidateDashboard";
import EmployerDashboard from "@/components/EmployerDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"candidate" | "employer" | "admin" | null>(null);

  useEffect(() => {
    checkUser();

    // Listen for auth events (e.g. SIGNED_OUT)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // Redirect to home if logged out
        navigate("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error || !profile) {
      console.error("Error fetching profile:", error);
      // If we have a session but no profile, the user was likely deleted.
      toast({
        title: "Account Restricted",
        description: "Your account profile could not be found. Please contact support or sign up again.",
        variant: "destructive",
      });
      await supabase.auth.signOut();
      navigate("/");
      return;
    } else {
      setUserRole(profile.role);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="py-6">
        {userRole === "candidate" && <CandidateDashboard />}
        {userRole === "employer" && <EmployerDashboard />}
        {userRole === "admin" && <AdminDashboard />} 
      </div>
    </div>
  );
};

export default Dashboard;