import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import Index from "./pages/Index";
import About from "./pages/About";
import CandidateAuth from "./pages/CandidateAuth";
import EmployerAuth from "./pages/EmployerAuth";
import AdminAuth from "./pages/AdminAuth";
import ResetPassword from "./pages/ResetPassword";
import Onboard from "./pages/Onboard";
import Dashboard from "./pages/Dashboard";
import JobDetail from "./pages/JobDetail";
import NotFound from "./pages/NotFound";
import FindJobs from "./pages/FindJobs";

const queryClient = new QueryClient();

const App = () => {
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