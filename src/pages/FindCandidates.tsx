import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, SlidersHorizontal, Briefcase, Target, Users, Mail, Linkedin, FileText, Calendar, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { calculateMatchScore } from "@/lib/email";
import { getResumeActionUrl } from "@/lib/resume";

const FindCandidates = () => {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmployer, setIsEmployer] = useState(false);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  
  // Helper to view resume with proper auth
  const handleViewResume = async (url: string) => {
    if (!url || isLoadingResume) return;
    setIsLoadingResume(true);
    
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    try {
      if (url.includes("/functions/v1/serve-resume")) {
        const headers: HeadersInit = {
          "Authorization": `Bearer ${anonKey}`,
          "apikey": anonKey,
        };
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch resume: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        window.open(blobUrl, "_blank", "noopener,noreferrer");
        
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error: any) {
      console.error("Error fetching resume:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingResume(false);
    }
  };
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [minExperience, setMinExperience] = useState("");
  const [workAuthFilter, setWorkAuthFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  
  // Employer Jobs for matching
  const [employerJobs, setEmployerJobs] = useState<any[]>([]);
  const [matchingJobId, setMatchingJobId] = useState<string>("none");

  useEffect(() => {
    checkAccessAndFetch();
  }, []);

  const checkAccessAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data: employerProfile } = await supabase
      .from("employer_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (employerProfile) {
      setIsEmployer(true);
      fetchCandidates();
      fetchEmployerJobs(employerProfile.id);
    } else {
      setLoading(false);
    }
  };

  const fetchEmployerJobs = async (employerId: string) => {
    const { data } = await supabase
      .from("jobs")
      .select("*, job_skills(*)")
      .eq("employer_id", employerId)
      .eq("is_active", true);
    setEmployerJobs(data || []);
  };

  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("candidate_profiles")
      .select(`
        *,
        profiles(full_name, email),
        candidate_skills(*)
      `)
      .order('experience_years', { ascending: false });

    if (error) {
      toast({ title: "Failed to load candidates", variant: "destructive" });
    } else {
      setCandidates(data || []);
    }
    setLoading(false);
  };

  const getMatchScore = (candidate: any) => {
    if (matchingJobId === "none") return 0;
    const job = employerJobs.find(j => j.id === matchingJobId);
    if (!job) return 0;
    return calculateMatchScore(candidate.candidate_skills || [], job.job_skills || [], candidate.desired_job_title, job.title);
  };

  const handleShortlist = async (candidateId: string) => {
    if (matchingJobId === "none") {
      toast({ title: "Select a job first", description: "Choose a job to shortlist this candidate for.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("applications").insert({
      job_id: matchingJobId,
      candidate_id: candidateId,
      status: "shortlisted"
    });

    if (error) {
       if (error.code === '23505') {
         toast({ title: "Already applied", description: "This candidate has already been processed for this job." });
       } else {
         toast({ title: "Action failed", description: error.message, variant: "destructive" });
       }
    } else {
      toast({ title: "Candidate Shortlisted!", description: "They have been added to your pipeline." });
    }
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const term = searchTerm.toLowerCase();
    
    // Search profile, title, location, or skills
    const matchesSearch =
      !term ||
      candidate.profiles?.full_name?.toLowerCase().includes(term) ||
      candidate.desired_job_title?.toLowerCase().includes(term) ||
      candidate.location?.toLowerCase().includes(term) ||
      candidate.candidate_skills?.some((s: any) => s.skill_name.toLowerCase().includes(term));

    const matchesExp = 
      !minExperience || 
      (candidate.experience_years && candidate.experience_years >= parseInt(minExperience));

    const matchesAuth = workAuthFilter === "all" || candidate.work_authorization === workAuthFilter;
    const matchesAvail = availabilityFilter === "all" || candidate.availability_status === availabilityFilter;

    return matchesSearch && matchesExp && matchesAuth && matchesAvail;
  });

  if (!loading && !isEmployer) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <Card className="p-10 max-w-md w-full bg-muted/20 border-dashed">
            <h2 className="text-2xl font-bold mb-3">Access Denied</h2>
            <p className="text-muted-foreground">Only registered employers have access to the global candidate database.</p>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="container mx-auto px-6 py-12 flex-grow max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4 border-b pb-8">
          <div className="w-full md:w-auto">
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Talent Network</h1>
            <p className="text-muted-foreground font-medium">Sourcing and connecting with high-impact contributors.</p>
          </div>

          {/* Search Inputs */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, title, skill, or location"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background h-12 shadow-sm border-muted-foreground/20 focus:ring-primary/20"
              />
            </div>
            <Button 
              variant={showFilters ? "default" : "outline"} 
              className="h-12 px-6 font-bold group border-muted-foreground/20"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
              Advanced Filters
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
           <div className="bg-muted/30 border p-6 rounded-2xl mb-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Expertise (Min Years)</label>
                 <Input 
                    placeholder="e.g. 5" 
                    type="number" 
                    value={minExperience} 
                    onChange={(e) => setMinExperience(e.target.value)} 
                    className="bg-background h-10"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Work Authorization</label>
                 <Select value={workAuthFilter} onValueChange={setWorkAuthFilter}>
                    <SelectTrigger className="bg-background h-10 font-bold text-xs">
                       <SelectValue placeholder="Any Visa status" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">Any Status</SelectItem>
                       <SelectItem value="H1B">H1B</SelectItem>
                       <SelectItem value="GC">Green Card</SelectItem>
                       <SelectItem value="USC">US Citizen</SelectItem>
                       <SelectItem value="CPT-EAD">CPT-EAD</SelectItem>
                       <SelectItem value="OPT-EAD">OPT-EAD</SelectItem>
                       <SelectItem value="TN">TN</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Engagement Status</label>
                 <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger className="bg-background h-10 font-bold text-xs">
                       <SelectValue placeholder="Any Availability" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">Any Status</SelectItem>
                       <SelectItem value="Available">Available</SelectItem>
                       <SelectItem value="Not Available">Not Available</SelectItem>
                       <SelectItem value="Open to Offers">Open to Offers</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              
              <div className="col-span-1 sm:col-span-2 md:col-span-3 flex justify-end mt-2 pt-4 border-t border-border/40">
                 <Button variant="ghost" size="sm" onClick={() => {
                    setMinExperience("");
                    setWorkAuthFilter("all");
                    setAvailabilityFilter("all");
                 }} className="text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-widest">
                    Discard Filters
                 </Button>
              </div>
           </div>
        )}

        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Identifying <strong className="text-foreground">{filteredCandidates.length}</strong> top candidates</span>
              {matchingJobId !== "none" && (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 h-6 px-2 font-black text-[9px] uppercase tracking-widest">
                   Sorted by Pipeline Fit 🎯
                </Badge>
              )}
           </div>
           
           <div className="flex items-center gap-4 bg-card p-2 rounded-xl border shadow-sm w-full md:w-auto">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 text-primary flex items-center gap-2">
                 <LayoutDashboard className="h-3 w-3" />
                 Match Logic:
              </span>
              <Select value={matchingJobId} onValueChange={setMatchingJobId}>
                 <SelectTrigger className="w-full md:w-[280px] bg-muted/30 h-10 text-xs font-bold border-none">
                    <SelectValue placeholder="Select active job..." />
                 </SelectTrigger>
                 <SelectContent className="border-none shadow-2xl rounded-xl">
                    <SelectItem value="none" className="font-bold text-xs uppercase tracking-widest">Default Pipeline</SelectItem>
                    {employerJobs.map(job => (
                       <SelectItem key={job.id} value={job.id} className="font-bold text-xs uppercase tracking-widest">{job.title}</SelectItem>
                    ))}
                 </SelectContent>
              </Select>
           </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-black uppercase tracking-widest">Scanning Workforce...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <Card className="text-center py-24 bg-muted/5 rounded-3xl border-dashed border-2 border-muted max-w-2xl mx-auto flex flex-col items-center">
            <div className="w-20 h-20 bg-muted/30 rounded-2xl flex items-center justify-center mb-6">
               <Search className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">No candidates found</h3>
            <p className="text-muted-foreground max-w-sm mt-2 font-medium">Try broadening your search parameters or removing active filters to discover more talent.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
            {filteredCandidates
              .map(c => ({ ...c, matchScore: getMatchScore(c) }))
              .sort((a,b) => b.matchScore - a.matchScore)
              .map((candidate) => (
              <Card key={candidate.id} className="p-0 hover:shadow-2xl transition-all duration-300 border-border/60 flex flex-col group relative overflow-hidden rounded-2xl bg-card">
                {candidate.matchScore > 0 && (
                   <div className="absolute top-0 right-0 z-10">
                      <div className="bg-primary text-primary-foreground text-[10px] font-black px-4 py-1.5 rounded-bl-xl shadow-lg shadow-primary/20 tracking-widest">
                         {candidate.matchScore}% MATCH
                      </div>
                   </div>
                )}
                
                <div className="p-6 space-y-6">
                   <div className="flex justify-between items-start pt-2">
                      <div className="space-y-1">
                         <h3 className="text-xl font-black leading-none uppercase tracking-tighter group-hover:text-primary transition-colors">{candidate.profiles?.full_name}</h3>
                         {candidate.desired_job_title && (
                            <div className="text-sm font-bold text-foreground">
                               {candidate.desired_job_title}
                            </div>
                         )}
                         <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{candidate.location || "Remote / Global"}</span>
                         </div>
                      </div>
                      <Badge variant={candidate.availability_status === 'Available' ? 'default' : 'secondary'} className="text-[9px] font-black uppercase tracking-widest border-transparent">
                         {candidate.availability_status || 'Available'}
                      </Badge>
                   </div>

                   <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-1.5 bg-blue-600/5 text-blue-600 px-2 py-1 rounded border border-blue-200/50 text-[10px] font-black uppercase tracking-tighter">
                         <Target className="h-3 w-3" />
                         {candidate.work_authorization}
                      </div>
                      <div className="flex items-center gap-1.5 bg-green-600/5 text-green-600 px-2 py-1 rounded border border-green-200/50 text-[10px] font-black uppercase tracking-tighter tabular-nums">
                         <Briefcase className="h-3 w-3" />
                         {candidate.experience_years ? `${candidate.experience_years}Y EXP` : 'ENTRY'}
                      </div>
                   </div>
                   
                   <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Core Competencies</Label>
                      <div className="flex flex-wrap gap-2 min-h-[48px]">
                        {candidate.candidate_skills?.slice(0, 6).map((s: any) => (
                           <span key={s.id} className="text-[10px] font-bold px-2 py-1 rounded bg-muted/50 text-foreground border border-transparent hover:border-primary/20 transition-all cursor-default">
                              {s.skill_name}
                           </span>
                        ))}
                        {candidate.candidate_skills && candidate.candidate_skills.length > 6 && (
                           <span className="text-[10px] text-muted-foreground font-black self-center ml-1">+{candidate.candidate_skills.length - 6}</span>
                        )}
                      </div>
                   </div>
                </div>

                <div className="mt-auto p-4 bg-muted/5 border-t flex flex-col gap-3 group-hover:bg-primary/5 transition-colors duration-500">
                  <div className="grid grid-cols-2 gap-3">
                     {candidate.resume_url ? (
                        <Button
                          variant="outline"
                          className="h-9 gap-2 text-[10px] font-black uppercase tracking-widest border-muted-foreground/20 hover:bg-background"
                          disabled={isLoadingResume}
                          onClick={() => void handleViewResume(getResumeActionUrl(candidate.resume_url, "view"))}
                        >
                          <FileText className="h-3.5 w-3.5" /> {isLoadingResume ? "Loading..." : "Resume"}
                        </Button>
                     ) : (
                        <Button variant="outline" disabled className="h-9 gap-2 text-[10px] font-black uppercase tracking-widest opacity-30">
                          <FileText className="h-3.5 w-3.5" /> No PDF
                        </Button>
                     )}
                     {candidate.linkedin_url ? (
                        <Button variant="outline" className="h-9 gap-2 text-[10px] font-black uppercase tracking-widest border-muted-foreground/20 hover:border-blue-500/50 hover:text-blue-600 transition-all" onClick={() => window.open(candidate.linkedin_url, "_blank")}>
                           <Linkedin className="h-3.5 w-3.5" /> Profile
                        </Button>
                     ) : (
                        <Button variant="outline" disabled className="h-9 gap-2 text-[10px] font-black uppercase tracking-widest opacity-30">
                           <Linkedin className="h-3.5 w-3.5" /> No LinkedIn
                        </Button>
                     )}
                  </div>
                  <Button variant="default" className="w-full h-11 font-black uppercase tracking-widest text-[11px] bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => handleShortlist(candidate.id)}>
                     Shortlist for Job
                  </Button>
                  <Button variant="ghost" className="w-full h-8 gap-2 text-[10px] font-bold text-muted-foreground hover:text-foreground" onClick={() => window.location.href = `mailto:${candidate.profiles?.email}`}>
                     <Mail className="h-3.5 w-3.5" /> Open Direct Channel
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default FindCandidates;
