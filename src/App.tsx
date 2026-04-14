import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import Index from "./pages/Index";
import About from "./pages/About";
import Legal from "./pages/Legal";
import Policy from "./pages/Policy";
import Terms from "./pages/Terms";
import CandidateAuth from "./pages/CandidateAuth";
import EmployerAuth from "./pages/EmployerAuth";
import AdminAuth from "./pages/AdminAuth";
import ResetPassword from "./pages/ResetPassword";
import Onboard from "./pages/Onboard";
import Dashboard from "./pages/Dashboard";
import JobDetail from "./pages/JobDetail";
import NotFound from "./pages/NotFound";
import FindJobs from "./pages/FindJobs";

import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Global Auth state monitoring and cleanup for broken sessions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth event: ${event}`);
      
      // Handle the "Invalid Refresh Token" case which leads to session being null
      if (session === null && (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION')) {
         // This is a normal state if user is logged out, but if internal refresh failed, 
         // it keeps session null. Supabase's library should handle clearing 
         // open_to_work_auth on signOut.
      }
      
      // Proactively catch the case where session persists in storage but is invalid on server
      if ((event as any) === 'TOKEN_REFRESH_FAILED' || (event === 'SIGNED_OUT' && session)) {
        console.warn("Auth state sync issue detected, cleaning up session.");
        await supabase.auth.signOut();
      }
    });

    // One-time health check for the session on mount
    const checkSession = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error && error.message.includes("Refresh Token Not Found")) {
           console.error("Critical Auth Error: Refresh Token Not Found. Signing out.");
           await supabase.auth.signOut();
           window.location.reload(); // Hard reset to clear memory
        }
      } catch (err) {
        console.error("Error checking session health:", err);
      }
    };
    
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboard" element={<Onboard />} />
            <Route path="/jobs" element={<FindJobs />} />
            <Route path="/about" element={<About />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/policy" element={<Policy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/candidate/auth" element={<CandidateAuth />} />
            <Route path="/employer/auth" element={<EmployerAuth />} />
            <Route path="/admin/auth" element={<AdminAuth />} />
            <Route path="/auth/reset" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;