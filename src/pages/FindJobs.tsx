import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobCard from "@/components/JobCard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, SlidersHorizontal, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const FindJobs = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidateSkills, setCandidateSkills] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  
  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [minSalary, setMinSalary] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [taxTermFilter, setTaxTermFilter] = useState("all");
  const [jobModeFilter, setJobModeFilter] = useState("all");
  const [visaFilter, setVisaFilter] = useState("all");

  useEffect(() => {
    fetchSessionAndData();
  }, []);

  const fetchSessionAndData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);

    if (session) {
      // Fetch Candidate Skills if they are a candidate
      const { data: profile } = await supabase
        .from("candidate_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();
        
      if (profile) {
        const { data: skills } = await supabase
          .from("candidate_skills")
          .select("*")
          .eq("candidate_id", profile.id);
        setCandidateSkills(skills || []);
      }
    }

    fetchJobs();
  };

  const fetchJobs = async () => {
    const now = new Date().toISOString();
    
    // Fetch all active jobs, then filter by expiry in code to handle NULL cases easily
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        employer:employer_profiles(company_name, location),
        job_skills(*)
      `)
      .eq('is_active', true)
      .eq('is_approved', true) // Added approval filter too
      .order('created_at', { ascending: false });

    if (!error) {
      const filteredJobs = (data || []).filter(job => {
        if (!job.expires_at) return true;
        return new Date(job.expires_at) > new Date();
      });
      setJobs(filteredJobs);
    }
    setLoading(false);
  };

  const getMatchScore = (job: any) => {
    if (!candidateSkills || candidateSkills.length === 0) return 0;
    
    // Hard Filter: Visa Match
    // If job has work auth requirements and candidate doesn't match any, score is 0
    // (Assuming candidate_profiles has a work_authorization field)
    // We'll fetch the candidate profile first to be sure
    // For now, let's focus on skills to avoid excessive DB calls in the scoring loop
    
    const reqSkills = job.job_skills?.filter((s: any) => s.is_required) || [];
    const optSkills = job.job_skills?.filter((s: any) => !s.is_required) || [];
    
    if (reqSkills.length === 0 && optSkills.length === 0) return 0;

    let score = 0;
    const reqWeight = 0.8;
    const optWeight = 0.2;

    // Required Skills Calculation
    if (reqSkills.length > 0) {
      let reqMatchedScore = 0;
      reqSkills.forEach((js: any) => {
        const candidateHasSkill = candidateSkills.find(cs => cs.skill_name.toLowerCase() === js.skill_name.toLowerCase());
        if (candidateHasSkill) {
          // Experience multiplier
          const expRatio = Math.min(candidateHasSkill.years_experience / (js.years_experience || 1), 1.2);
          reqMatchedScore += 1 * expRatio;
        }
      });
      score += (reqMatchedScore / reqSkills.length) * reqWeight * 100;
    } else {
      // If no required skills, give full weight to weight (or adjust logic)
      score += reqWeight * 100;
    }

    // Optional Skills Calculation
    if (optSkills.length > 0) {
      let optMatchedScore = 0;
      optSkills.forEach((js: any) => {
        const candidateHasSkill = candidateSkills.find(cs => cs.skill_name.toLowerCase() === js.skill_name.toLowerCase());
        if (candidateHasSkill) {
          optMatchedScore += 1;
        }
      });
      score += (optMatchedScore / optSkills.length) * optWeight * 100;
    }

    return Math.min(Math.round(score), 100);
  };

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.toLowerCase();
    const loc = locationFilter.toLowerCase();
    
    const matchesSearch =
      !term ||
      job.title.toLowerCase().includes(term) ||
      job.description.toLowerCase().includes(term) ||
      job.employer?.company_name?.toLowerCase().includes(term);

    const matchesLocation =
      !loc || 
      job.location.toLowerCase().includes(loc);

    const matchesSalary = 
      !minSalary || 
      (job.salary_max && job.salary_max >= parseInt(minSalary)) || 
      (job.salary_min && job.salary_min >= parseInt(minSalary));

    const matchesType = jobTypeFilter === "all" || (job.job_type && job.job_type.includes(jobTypeFilter));
    const matchesTaxTerm = taxTermFilter === "all" || (job.job_type && job.job_type.includes(taxTermFilter));
    const matchesMode = jobModeFilter === "all" || job.job_mode === jobModeFilter;
    
    const matchesVisa = visaFilter === "all" || (job.work_authorization && job.work_authorization.includes(visaFilter));

    return matchesSearch && matchesLocation && matchesSalary && matchesType && matchesTaxTerm && matchesMode && matchesVisa;
  });

  // Attach match score and sort if logged in
  const sortedJobs = filteredJobs.map(job => ({
    ...job,
    matchScore: getMatchScore(job)
  })).sort((a, b) => b.matchScore - a.matchScore); // Always sort highest match first

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="container mx-auto px-6 py-12 flex-grow">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4 border-b pb-6">
          <div className="w-full md:w-auto">
            <h1 className="text-4xl font-bold mb-2">Find Jobs</h1>
            <p className="text-muted-foreground">Discover your next career move</p>
          </div>

          {/* Search Inputs */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Job title, keyword, or company"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background h-11"
              />
            </div>
            <div className="relative w-full sm:w-64">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-9 bg-background h-11"
              />
            </div>
            <Button 
              variant={showFilters ? "default" : "outline"} 
              className="h-11 sm:w-auto w-full group"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
              Filters
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
           <div className="bg-muted/30 border p-5 rounded-lg mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-muted-foreground uppercase px-1">Min Salary</label>
                 <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="e.g. 80000" 
                        type="number" 
                        value={minSalary} 
                        onChange={(e) => setMinSalary(e.target.value)} 
                        className="pl-9 bg-background"
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-muted-foreground uppercase px-1">Job Type</label>
                 <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                    <SelectTrigger className="bg-background">
                       <SelectValue placeholder="Any Type" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">Any Type</SelectItem>
                       <SelectItem value="Full time">Full time</SelectItem>
                       <SelectItem value="Part time">Part time</SelectItem>
                       <SelectItem value="Contract">Contract</SelectItem>
                       <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-muted-foreground uppercase px-1">Tax Terms</label>
                 <Select value={taxTermFilter} onValueChange={setTaxTermFilter}>
                    <SelectTrigger className="bg-background">
                       <SelectValue placeholder="Any Term" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">Any Term</SelectItem>
                       <SelectItem value="W2">W2</SelectItem>
                       <SelectItem value="C2C">C2C</SelectItem>
                       <SelectItem value="1099">1099</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-muted-foreground uppercase px-1">Work Mode</label>
                 <Select value={jobModeFilter} onValueChange={setJobModeFilter}>
                    <SelectTrigger className="bg-background">
                       <SelectValue placeholder="Any Mode" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">Any Mode</SelectItem>
                       <SelectItem value="On-Site">On-Site</SelectItem>
                       <SelectItem value="Hybrid">Hybrid</SelectItem>
                       <SelectItem value="Remote">Remote</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-muted-foreground uppercase px-1">Visa</label>
                 <Select value={visaFilter} onValueChange={setVisaFilter}>
                    <SelectTrigger className="bg-background">
                       <SelectValue placeholder="Any Visa Status" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">Any Status</SelectItem>
                       <SelectItem value="H1B">H1B Sponsorship</SelectItem>
                       <SelectItem value="GC">Green Card</SelectItem>
                       <SelectItem value="USC">US Citizen</SelectItem>
                       <SelectItem value="CPT-EAD">CPT-EAD</SelectItem>
                       <SelectItem value="OPT-EAD">OPT-EAD</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
                            <div className="col-span-1 sm:col-span-2 md:col-span-4 flex justify-between items-center mt-4 pt-4 border-t border-border/40">
                  <div className="flex gap-2">
                     <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent cursor-pointer hover:bg-primary/20" onClick={() => setMinSalary("100000")}>$100k+</Badge>
                     <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent cursor-pointer hover:bg-primary/20" onClick={() => setJobModeFilter("Remote")}>Remote Only</Badge>
                     <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent cursor-pointer hover:bg-primary/20" onClick={() => setVisaFilter("H1B")}>H1B Support</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                     setMinSalary("");
                     setJobTypeFilter("all");
                     setTaxTermFilter("all");
                     setJobModeFilter("all");
                     setVisaFilter("all");
                  }} className="text-muted-foreground hover:text-foreground text-[11px] font-bold uppercase tracking-widest">
                     Reset Filters
                  </Button>
               </div>
            </div>
        )}

        <div className="mb-6 flex justify-between items-center text-sm text-muted-foreground">
           <span>Showing <strong className="text-foreground">{sortedJobs.length}</strong> jobs</span>
           {candidateSkills.length > 0 && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                 Sorted by Match Score 🎯
              </Badge>
           )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-lg text-muted-foreground animate-pulse font-medium">Loading opportunities...</p>
          </div>
        ) : sortedJobs.length === 0 ? (
          <div className="text-center py-24 bg-muted/20 rounded-2xl border border-dashed border-border/60 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Search className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No matched jobs found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or search terms to see more results.</p>
            <Button 
              variant="outline" 
              onClick={() => { 
                setSearchTerm(""); setLocationFilter(""); setMinSalary("");
                setJobTypeFilter("all"); setTaxTermFilter("all"); setJobModeFilter("all"); setVisaFilter("all");
              }}
              className="min-w-[150px]"
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {sortedJobs.map((job) => {
               // Combine legacy skills_required string array with new job_skills table objects
               let displaySkills: string[] = [];
               if (job.job_skills && job.job_skills.length > 0) {
                  displaySkills = job.job_skills.map((s: any) => s.skill_name);
               } else if (job.skills_required && job.skills_required.length > 0) {
                  displaySkills = job.skills_required;
               }

               return (
                  <JobCard
                     key={job.id}
                     id={job.id}
                     title={job.title}
                     company={job.employer?.company_name}
                     location={job.location}
                     salaryMin={job.salary_min}
                     salaryMax={job.salary_max}
                     jobType={job.job_type}
                     jobMode={job.job_mode}
                     workAuthorization={job.work_authorization}
                     skills={displaySkills}
                     matchScore={job.matchScore}
                  />
               );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default FindJobs;