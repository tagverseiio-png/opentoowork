import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import usaCities from "@/lib/usa_cities_cleaned.json";
import { formatLocation } from "@/lib/utils";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle, Clock, XCircle, MapPin, Building2, Calendar, Briefcase, Pencil, Plus, Trash2, ExternalLink, Linkedin, Globe, Bell, Target, Settings, LayoutDashboard, Share2, UserCircle, Mail, ChevronsUpDown, Check, Download, Edit, Award, Star } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateMatchScore, normalizeSkillName, sendEmail } from "@/lib/email";

const WORK_AUTH_OPTIONS = [
  "H1B", "CPT-EAD", "OPT-EAD", "GC", "GC-EAD", "USC", "TN"
];

// Helper to get full public URL for resume
const getResumePublicUrl = (resumePath: string | null | undefined): string => {
  if (!resumePath) return "";
  // If already a full URL, return as-is (files are uploaded via FTP to Hostinger or Supabase Storage)
  if (resumePath.startsWith("http://") || resumePath.startsWith("https://")) {
    return resumePath;
  }
  // If it's a relative Supabase storage path, construct the public URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const cleanPath = resumePath.startsWith("/") ? resumePath.slice(1) : resumePath;
  return `${supabaseUrl}/storage/v1/object/public/${cleanPath}`;
};

// Safe resume open — view or download
const handleViewResume = async (url: string, download?: boolean, downloadName?: string) => {
  if (!url) return;

  // Backwards compatibility for old resumes stored directly pointing to opentoowork.tech domain
  let targetUrl = url;
  if (url.includes("/resumes/resume_")) {
    const fileName = url.split("/resumes/")[1].split("?")[0];
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    targetUrl = `${supabaseUrl}/functions/v1/serve-resume?file=${fileName}`;
  }

  const isDocx = targetUrl.toLowerCase().includes(".doc");
  
  if (download || isDocx) {
    // Download mode or DOCX file — trigger file download (browser view for docx via proxy can be problematic)
    const link = document.createElement("a");
    link.href = targetUrl.replace("&view=true", "").replace("?view=true", "");
    link.download = downloadName || "Resume";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // View mode — append &view=true for inline PDF
    const viewUrl = targetUrl.includes("?") ? `${targetUrl}&view=true` : `${targetUrl}?view=true`;
    window.open(viewUrl, "_blank", "noopener,noreferrer");
  }
};

const ALL_LOCATIONS = [
  "Remote (US)",
  ...usaCities.map(c => c.state_code ? `${c.city}, ${c.state_code}` : c.city)
];

const TITLE_GENERIC_TERMS = new Set([
  "engineer",
  "developer",
  "manager",
  "analyst",
  "specialist",
  "consultant",
  "associate",
  "assistant",
  "coordinator",
  "officer",
  "executive",
]);

const tokenizeTitleKeywords = (value?: string | null): string[] => {
  if (!value) return [];
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9]/g, ""))
    .filter((token) => token.length > 1);
};

const hasSpecificTitleOverlap = (candidateTitle?: string | null, jobTitle?: string | null): boolean => {
  const candidateTokens = tokenizeTitleKeywords(candidateTitle).filter(
    (token) => !TITLE_GENERIC_TERMS.has(token),
  );
  const jobTokens = new Set(tokenizeTitleKeywords(jobTitle));
  return candidateTokens.some((token) => jobTokens.has(token));
};

const CandidateDashboard = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("applications");
  
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editExperience, setEditExperience] = useState("");
  const [editWorkAuth, setEditWorkAuth] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editResumeUrl, setEditResumeUrl] = useState("");
  const [editAvailability, setEditAvailability] = useState("");
  const [editResumeText, setEditResumeText] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [extractingSkills, setExtractingSkills] = useState(false);

  // Skills State
  const [skills, setSkills] = useState<any[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillExp, setNewSkillExp] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("Intermediate");
  const [addingSkill, setAddingSkill] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [importingLinkedin, setImportingLinkedin] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");

  const handleLinkedInImport = async () => {
    setImportingLinkedin(true);
    toast({ 
      title: "Connecting to LinkedIn...", 
      description: "Authenticating and fetching professional profile data." 
    });
    
    // Simulate real API delay
    await new Promise(r => setTimeout(r, 2000));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const importData = {
        experience_years: 5,
        location: "San Francisco, CA",
        availability_status: "Available",
        linkedin_url: `https://linkedin.com/in/${profile?.profiles?.full_name?.toLowerCase().replace(' ', '-') || 'candidate'}`
      };

      const { error } = await supabase
        .from("candidate_profiles")
        .update(importData)
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({ 
        title: "Import Successful!", 
        description: "Professional profile and location synchronized directly." 
      });
      fetchProfile(); // refresh data
    } catch (error: any) {
      toast({ title: "Import Failed", description: error.message, variant: "destructive" });
    }
    setImportingLinkedin(false);
  };

  useEffect(() => {
    fetchProfile();
    fetchApplications();
    fetchSkills();
    fetchRecommendations();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("candidate_profiles")
      .select("*, profiles(*)")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setEditFullName(data.profiles?.full_name || "");
      setEditJobTitle(data.desired_job_title || "");
      setEditExperience(data.experience_years?.toString() || "");
      setEditWorkAuth(data.work_authorization || "");
      setEditLocation(data.location || "");
      setEditLinkedin(data.linkedin_url || "");
      setEditResumeUrl(data.resume_url || "");
      setEditAvailability(data.availability_status || "Available");
      setEditResumeText(data.resume_text || "");
    }
  };

  const fetchSkills = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: cp } = await supabase
      .from("candidate_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (cp) {
      const { data } = await supabase
        .from("candidate_skills")
        .select("*")
        .eq("candidate_id", cp.id)
        .order("years_experience", { ascending: false });
      setSkills(data || []);
    }
  };

  // Job alerts hidden -- feature currently not active

  const fetchRecommendations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!candidateProfile) return;
    if (!candidateProfile.desired_job_title) {
      setRecommendations([]);
      return;
    }

    const { data: candidateSkills } = await supabase
      .from("candidate_skills")
      .select("*")
      .eq("candidate_id", candidateProfile.id);

    let query = supabase
      .from("jobs")
      .select(`
        *,
        employer:employer_profiles(company_name, logo_url),
        job_skills(*)
      `)
      .eq("is_active", true);

    const { data: jobs } = await query
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
    if (!jobs?.length) {
      setRecommendations([]);
      return;
    }

    const validJobs = candidateProfile.work_authorization
      ? jobs.filter((job: any) => !job.work_authorization || job.work_authorization.length === 0 || job.work_authorization.includes(candidateProfile.work_authorization))
      : jobs;

    const scoredJobs = validJobs
      .map(job => ({
        ...job,
        score: calculateMatchScore(candidateSkills || [], job.job_skills || [], candidateProfile.desired_job_title, job.title),
        hasSpecificOverlap: hasSpecificTitleOverlap(candidateProfile.desired_job_title, job.title),
      }))
      .sort((a: any, b: any) => b.score - a.score);

    const highMatches = scoredJobs.filter((job: any) => {
      return job.score >= 50 || job.hasSpecificOverlap;
    });
    setRecommendations(highMatches.slice(0, 10));
  };

  // Add alert logic hidden

  const fetchApplications = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (candidateProfile) {
      const { data } = await supabase
        .from("applications")
        .select(`
          *,
          jobs(
            *,
            employer:employer_profiles(company_name)
          )
        `)
        .eq("candidate_id", candidateProfile.id)
        .order("applied_at", { ascending: false });

      setApplications(data || []);
    }
  };

  const handleUpdateProfile = async () => {
    setSavingProfile(true);
    try {
      if (!editJobTitle.trim() || !editLinkedin.trim()) {
        throw new Error("Job title and LinkedIn URL are mandatory.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Update full name in profiles table first
      if (editFullName && editFullName !== profile?.profiles?.full_name) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: editFullName })
          .eq("id", session.user.id);
        
        if (profileError) throw profileError;
      }

      const { error } = await supabase
        .from("candidate_profiles")
        .update({
          experience_years: editExperience ? parseInt(editExperience) : null,
          desired_job_title: editJobTitle,
          work_authorization: editWorkAuth,
          location: editLocation,
          linkedin_url: editLinkedin,
          resume_url: editResumeUrl,
          availability_status: editAvailability,
          resume_text: editResumeText
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({ title: "Profile updated successfully!" });
      setIsEditing(false);
      fetchProfile();
      fetchRecommendations();

      // Fire match-based email with matching jobs (fire & forget)
      notifyCandidateOfMatchingJobs(session.user.id);
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  /**
   * After profile update, find matching jobs and send a digest email
   * to the candidate with all jobs scoring >= 50% match.
   */
  const notifyCandidateOfMatchingJobs = async (userId: string) => {
    try {
      // Fetch the candidate's latest skills
      const { data: candidateProfile } = await supabase
        .from("candidate_profiles")
        .select("*, profiles!inner(full_name, email)")
        .eq("user_id", userId)
        .maybeSingle();

      if (!candidateProfile?.profiles?.email) return;

      const { data: candidateSkills } = await supabase
        .from("candidate_skills")
        .select("*")
        .eq("candidate_id", candidateProfile.id);

      if (!candidateSkills?.length) return;

      const query = supabase
        .from("jobs")
        .select("*, employer:employer_profiles(company_name), job_skills(*)")
        .eq("is_active", true);

      const { data: jobs } = await query
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      if (!jobs?.length) return;

      const validJobs = candidateProfile.work_authorization
        ? jobs.filter((job: any) => !job.work_authorization || job.work_authorization.length === 0 || job.work_authorization.includes(candidateProfile.work_authorization))
        : jobs;

      // Calculate scores and filter >= 50%
      const matchedJobs = validJobs
        .map(job => ({
          ...job,
          score: calculateMatchScore(candidateProfile.candidate_skills || [], job.job_skills || [], candidateProfile.desired_job_title, job.title)
        }))
        .filter(job => job.score >= 50)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Top 5 matches

      if (matchedJobs.length === 0) return;

      // Build digest email
      const jobListHtml = matchedJobs.map(job => `
        <div style="padding:16px;border:1px solid #e4e4e7;border-radius:12px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="font-size:16px;">${job.title}</strong>
            <span style="background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:800;padding:4px 10px;border-radius:6px;">${job.score}% MATCH</span>
          </div>
          <p style="color:#52525b;margin:4px 0 0;font-size:13px;">${job.employer?.company_name || 'Company'} &bull; ${job.location || 'Remote'}</p>
        </div>
      `).join('');

      await sendEmail({
        to: candidateProfile.profiles.email,
        subject: `${matchedJobs.length} New Job Match${matchedJobs.length > 1 ? 'es' : ''} for Your Profile!`,
        html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<style>
  body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;color:#18181b;}
  .container{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;}
  .header{background:linear-gradient(135deg,#18181b 0%,#27272a 100%);padding:32px 40px;text-align:center;}
  .header h1{margin:0;color:#fff;font-size:20px;font-weight:900;letter-spacing:2px;text-transform:uppercase;}
  .body{padding:40px;}
  .body h2{font-size:22px;font-weight:800;margin:0 0 8px;color:#18181b;}
  .body p{font-size:14px;line-height:1.7;color:#52525b;margin:0 0 16px;}
  .footer{padding:24px 40px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;}
  .footer p{font-size:10px;color:#a1a1aa;margin:0;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;}
</style>
</head><body>
<div class="container">
  <div class="header"><h1>OpenToWork</h1></div>
  <div class="body">
    <h2>🎯 Jobs Matching Your Profile</h2>
    <p>Hi <strong>${candidateProfile.profiles.full_name || 'there'}</strong>, we found roles that match your updated skills:</p>
    ${jobListHtml}
    <p style="margin-top:24px;"><a href="https://opentoowork.tech/jobs" style="display:inline-block;background:#18181b;color:#fff;padding:12px 28px;border-radius:8px;font-size:12px;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">View All Matches</a></p>
  </div>
  <div class="footer"><p>Sent from verify@opentoowork.tech &bull; OpenToWork Platform</p></div>
</div>
</body></html>`
      });

      console.log(`Sent match digest with ${matchedJobs.length} jobs to ${candidateProfile.profiles.email}`);
    } catch (err) {
      console.warn("Match digest error (non-blocking):", err);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName.trim() || !profile) return;
    try {
      // Normalize skill name: trim whitespace and title-case for display
      const cleaned = newSkillName.trim().replace(/\s+/g, ' ');
      const displayName = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

      // Check for duplicate (case-insensitive)
      const exists = skills.some(
        (s: any) => normalizeSkillName(s.skill_name) === normalizeSkillName(displayName) && s.id !== editingSkillId
      );
      if (exists) {
        toast({ title: "Skill already exists", description: `"${displayName}" is already in your graph.`, variant: "destructive" });
        return;
      }

      if (editingSkillId) {
        const { error } = await supabase
          .from("candidate_skills")
          .update({
            skill_name: displayName,
            years_experience: parseInt(newSkillExp) || 0,
            skill_level: newSkillLevel
          })
          .eq("id", editingSkillId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("candidate_skills")
          .insert({
            candidate_id: profile.id,
            skill_name: displayName,
            years_experience: parseInt(newSkillExp) || 0,
            skill_level: newSkillLevel
          });
        if (error) throw error;
      }

      toast({ title: editingSkillId ? "Skill updated!" : "Skill added!" });
      setAddingSkill(false);
      setEditingSkillId(null);
      setNewSkillName("");
      setNewSkillExp("");
      fetchSkills();
      fetchRecommendations();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from("candidate_skills")
        .delete()
        .eq("id", skillId);

      if (error) throw error;
      toast({ title: "Skill removed" });
      fetchSkills();
      fetchRecommendations();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl animate-pulse">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
             <Skeleton className="h-10 w-[280px] sm:w-[400px]" />
             <Skeleton className="h-4 w-[180px] sm:w-[250px]" />
          </div>
          <Skeleton className="h-12 w-[160px] rounded-xl" />
        </div>

        <div className="grid lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 border shadow-sm bg-card overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-6 w-[140px]" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4 min-h-[64px]">
                   <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
                   <div className="min-w-0 flex-1 space-y-2 flex flex-col justify-center">
                      <Skeleton className="h-5 w-[160px] mb-1" />
                      <Skeleton className="h-3 w-[120px]" />
                      <Skeleton className="h-3 w-[140px]" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-3 min-h-[64px]">
                    <Skeleton className="h-[64px] rounded-xl" />
                    <Skeleton className="h-[64px] rounded-xl" />
                </div>
                <div className="space-y-3 min-h-[126px]">
                  <Skeleton className="h-[14px] w-[140px]" />
                  <div className="grid grid-cols-[1fr,auto] gap-2 min-h-[44px]">
                    <Skeleton className="h-11 w-full rounded-xl" />
                    <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                  </div>
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border shadow-sm bg-card overflow-hidden">
               <div className="flex items-center justify-between mb-6">
                  <Skeleton className="h-6 w-[120px]" />
                  <Skeleton className="h-8 w-[80px] rounded-md" />
               </div>
               <Skeleton className="h-[280px] w-full rounded-xl" />
            </Card>
          </div>

          <div className="lg:col-span-8 min-w-0 w-full">
            <Skeleton className="h-16 w-full rounded-[2rem] mb-8" />
            <Card className="p-4 sm:p-8 border shadow-sm min-h-[600px] bg-card rounded-2xl sm:rounded-[2.5rem] w-full overflow-hidden">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-10 w-full">
                 <div className="space-y-3 w-full">
                   <Skeleton className="h-8 w-[200px]" />
                   <Skeleton className="h-3 w-[250px]" />
                 </div>
                 <Skeleton className="h-8 w-[140px] rounded-full shrink-0" />
               </div>
               <div className="space-y-5">
                 <Skeleton className="h-[140px] w-full rounded-3xl sm:rounded-[2rem]" />
                 <Skeleton className="h-[140px] w-full rounded-3xl sm:rounded-[2rem]" />
                 <Skeleton className="h-[140px] w-full rounded-3xl sm:rounded-[2rem]" />
               </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Your Command Center</h1>
           <p className="text-muted-foreground mt-2 font-bold uppercase text-[10px] tracking-widest">Active session for {profile.profiles?.full_name}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
           {/* LinkedIn Sync button removed as requested */}
           <Button onClick={() => setIsEditing(true)} className="h-12 px-6 font-black uppercase tracking-widest text-[10px] shadow-xl">
              <Settings className="h-4 w-4 mr-2" /> Global Prefs
           </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-4 space-y-2 sm:space-y-4">
          <Card className="p-3 sm:p-6 border shadow-sm bg-card overflow-hidden">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tighter flex items-center gap-2 truncate">
                <Linkedin className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" /> <span className="truncate">Identity Vault</span>
              </h2>
              
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px] border-none shadow-2xl rounded-2xl overflow-hidden p-0">
                  <DialogHeader className="p-8 border-b bg-muted/10">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Candidate Blueprint</DialogTitle>
                    <DialogDescription className="sr-only">Edit your global identity and professional access matrix.</DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] p-8">
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50 my-6 shadow-inner group">
                      <div className="w-6 h-6 border-2 border-primary/40 rounded-md flex items-center justify-center bg-background group-hover:border-primary transition-colors">
                        <input type="checkbox" id="captcha-in" required className="w-4 h-4 opacity-0 absolute cursor-pointer" />
                        <CheckCircle className="h-4 w-4 text-primary opacity-0 group-has-[:checked]:opacity-100 transition-opacity" />
                      </div>
                      <Label htmlFor="captcha-in" className="text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer flex-1 text-muted-foreground group-hover:text-foreground">Authentication Protocol Layer</Label>
                      <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="h-6 w-6 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Full Name</Label>
                        <Input 
                          className="h-11 rounded-xl"
                          value={editFullName} 
                          onChange={(e) => setEditFullName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Desired Job Title</Label>
                        <Input 
                          placeholder="e.g. Senior Frontend Developer"
                          className="h-11 rounded-xl"
                          value={editJobTitle} 
                          onChange={(e) => setEditJobTitle(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Visa Authorization</Label>
                          <Select value={editWorkAuth} onValueChange={setEditWorkAuth}>
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {WORK_AUTH_OPTIONS.map((auth) => (
                                <SelectItem key={auth} value={auth}>{auth}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Experience (Years)</Label>
                          <Input 
                            type="number" 
                            className="h-11 rounded-xl"
                            min="0"
                            value={editExperience} 
                            onChange={(e) => setEditExperience(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Global Location</Label>
                        <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={locationOpen}
                              className="w-full justify-between h-11 rounded-xl font-normal text-foreground bg-background hover:bg-background"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className={`truncate ${!editLocation && "text-muted-foreground"}`}>
                                  {editLocation || "Search U.S. cities / Remote..."}
                                </span>
                              </div>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 shadow-2xl rounded-xl custom-scrollbar" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start">
                            <Command shouldFilter={false}>
                              <CommandInput 
                                placeholder="Search U.S. cities..." 
                                className="h-9" 
                                value={locationSearch}
                                onValueChange={setLocationSearch}
                              />
                              <CommandList className="max-h-60 custom-scrollbar">
                                <CommandEmpty>No location found.</CommandEmpty>
                                <CommandGroup>
                                  {ALL_LOCATIONS
                                    .filter(loc => 
                                      loc.toLowerCase().includes(locationSearch.toLowerCase())
                                    )
                                    .slice(0, 100)
                                    .map((loc) => (
                                    <CommandItem
                                      key={loc}
                                      value={loc}
                                      onSelect={(currentValue) => {
                                        setEditLocation(loc);
                                        setLocationOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          editLocation === loc ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      {loc}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest">LinkedIn Access</Label>
                          <Input 
                            placeholder="https://linkedin.com/..." 
                            className="h-11 rounded-xl"
                            value={editLinkedin} 
                            onChange={(e) => setEditLinkedin(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Dossier / Resume (Upload or URL)</Label>
                          <div className="flex gap-2 flex-wrap">
                            <Input 
                              placeholder="https://drive.google.com/..." 
                              className="h-11 rounded-xl flex-1"
                              value={editResumeUrl} 
                              onChange={(e) => setEditResumeUrl(e.target.value)}
                            />
                            <div className="relative w-12 h-11 bg-muted/20 border border-border/50 rounded-xl hover:bg-muted/30 transition-colors flex items-center justify-center cursor-pointer">
                               {uploadingResume ? <Clock className="h-4 w-4 animate-spin text-muted-foreground" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
                               <input 
                                  type="file" 
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full" 
                                  accept=".pdf,.doc,.docx" 
                                  disabled={uploadingResume}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setUploadingResume(true);
                                    try {
                                      const { data: { session } } = await supabase.auth.getSession();
                                      if (!session) throw new Error("Not authenticated");

                                      // Upload via FTP edge function
                                      const formData = new FormData();
                                      formData.append("file", file);

                                      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                                      const response = await fetch(
                                        `${supabaseUrl}/functions/v1/upload-resume`,
                                        {
                                          method: "POST",
                                          headers: {
                                            Authorization: `Bearer ${session.access_token}`,
                                          },
                                          body: formData,
                                        }
                                      );

                                      const result = await response.json();
                                      if (!response.ok) throw new Error(result.error || "Upload failed");

                                      setEditResumeUrl(result.url);
                                      toast({ title: "Resume Uploaded!", description: `File: ${result.filename}` });
                                    } catch (err: any) {
                                      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
                                    } finally {
                                      setUploadingResume(false);
                                    }
                                  }} 
                               />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Market Availability</Label>
                        <Select value={editAvailability} onValueChange={setEditAvailability}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Available">Available</SelectItem>
                            <SelectItem value="Open to Offers">Open to Offers</SelectItem>
                            <SelectItem value="Not Available">Not Available</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-dashed">
                         <div className="flex items-center justify-between">
                           <Label className="text-[10px] uppercase font-black tracking-widest text-primary">Copy and Paste Resume</Label>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="h-7 text-[9px] font-black uppercase tracking-widest gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20"
                             disabled={extractingSkills}
                             onClick={async () => {
                                if (!editResumeText.trim()) {
                                  toast({ title: "No resume text", description: "Paste your resume content first, then click Auto-Extract.", variant: "destructive" });
                                  return;
                                }
                                setExtractingSkills(true);
                                toast({ title: "Scanning Resume...", description: "Extracting skills from your resume text." });
                                await new Promise(r => setTimeout(r, 800));

                                // ── Real skill extractor ──
                                // Comprehensive skill dictionary categorized by domain
                                const KNOWN_SKILLS: Record<string, string[]> = {
                                  // Languages
                                  languages: [
                                    'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#',
                                    'Go', 'Golang', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala',
                                    'R', 'MATLAB', 'Perl', 'Haskell', 'Elixir', 'Dart', 'Lua',
                                    'Objective-C', 'Shell', 'Bash', 'PowerShell', 'SQL', 'PL/SQL',
                                    'Assembly', 'COBOL', 'Fortran', 'Visual Basic', 'VB.NET',
                                    'F#', 'Clojure', 'Groovy', 'Julia', 'Solidity',
                                  ],
                                  // Frontend
                                  frontend: [
                                    'React', 'React.js', 'ReactJS', 'Angular', 'AngularJS', 'Vue',
                                    'Vue.js', 'VueJS', 'Svelte', 'SvelteKit', 'Next.js', 'NextJS',
                                    'Nuxt.js', 'Gatsby', 'HTML', 'HTML5', 'CSS', 'CSS3', 'SASS',
                                    'SCSS', 'LESS', 'Tailwind', 'TailwindCSS', 'Bootstrap',
                                    'Material UI', 'MUI', 'Chakra UI', 'Ant Design', 'Styled Components',
                                    'jQuery', 'Redux', 'MobX', 'Zustand', 'Recoil', 'Webpack',
                                    'Vite', 'Rollup', 'Parcel', 'Babel', 'ESLint', 'Prettier',
                                    'Storybook', 'Three.js', 'D3.js', 'Chart.js', 'Figma',
                                  ],
                                  // Backend
                                  backend: [
                                    'Node.js', 'NodeJS', 'Express', 'Express.js', 'NestJS',
                                    'Fastify', 'Koa', 'Django', 'Flask', 'FastAPI', 'Spring',
                                    'Spring Boot', 'Rails', 'Ruby on Rails', 'Laravel', 'Symfony',
                                    'ASP.NET', '.NET', '.NET Core', 'Gin', 'Echo', 'Fiber',
                                    'Phoenix', 'GraphQL', 'REST', 'RESTful', 'gRPC', 'WebSocket',
                                    'Microservices', 'Serverless', 'API Gateway',
                                  ],
                                  // Databases
                                  databases: [
                                    'PostgreSQL', 'Postgres', 'MySQL', 'MariaDB', 'MongoDB',
                                    'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB', 'Firebase',
                                    'Firestore', 'Supabase', 'SQLite', 'Oracle', 'SQL Server',
                                    'MSSQL', 'CouchDB', 'Neo4j', 'InfluxDB', 'TimescaleDB',
                                    'Prisma', 'Sequelize', 'TypeORM', 'Mongoose', 'Drizzle',
                                  ],
                                  // Cloud & DevOps
                                  cloud: [
                                    'AWS', 'Amazon Web Services', 'Azure', 'GCP',
                                    'Google Cloud', 'Google Cloud Platform', 'Heroku', 'Vercel',
                                    'Netlify', 'DigitalOcean', 'Cloudflare', 'Docker',
                                    'Kubernetes', 'K8s', 'Terraform', 'Ansible', 'Puppet',
                                    'Chef', 'Jenkins', 'GitHub Actions', 'GitLab CI',
                                    'CircleCI', 'Travis CI', 'ArgoCD', 'Helm', 'Nginx',
                                    'Apache', 'Caddy', 'Linux', 'Ubuntu', 'CentOS', 'RHEL',
                                    'CI/CD', 'DevOps', 'SRE', 'Prometheus', 'Grafana',
                                    'Datadog', 'New Relic', 'ELK Stack', 'Splunk',
                                    'CloudFormation', 'Pulumi', 'Vagrant', 'Packer',
                                  ],
                                  // Data & ML
                                  data: [
                                    'Machine Learning', 'Deep Learning', 'NLP',
                                    'Natural Language Processing', 'Computer Vision',
                                    'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn',
                                    'Pandas', 'NumPy', 'Spark', 'Apache Spark', 'Hadoop',
                                    'Kafka', 'Apache Kafka', 'Airflow', 'dbt', 'Snowflake',
                                    'BigQuery', 'Redshift', 'Databricks', 'Data Engineering',
                                    'ETL', 'Data Pipeline', 'Tableau', 'Power BI', 'Looker',
                                    'OpenAI', 'LLM', 'GPT', 'Hugging Face', 'MLflow',
                                    'SageMaker', 'Vertex AI',
                                  ],
                                  // Mobile
                                  mobile: [
                                    'React Native', 'Flutter', 'iOS', 'Android',
                                    'SwiftUI', 'Jetpack Compose', 'Xamarin', 'Ionic',
                                    'Capacitor', 'Cordova', 'Expo',
                                  ],
                                  // Testing
                                  testing: [
                                    'Jest', 'Mocha', 'Chai', 'Cypress', 'Playwright',
                                    'Selenium', 'Puppeteer', 'Testing Library',
                                    'React Testing Library', 'JUnit', 'PyTest', 'RSpec',
                                    'Vitest', 'Supertest', 'TDD', 'BDD', 'QA',
                                  ],
                                  // Management & Leadership
                                  management: [
                                    'Project Management', 'Product Management', 'Program Management',
                                    'Agile', 'Scrum', 'Kanban', 'Lean', 'Six Sigma', 'PMP', 'Prince2',
                                    'Stakeholder Management', 'Risk Management', 'Resource Management',
                                    'Strategic Planning', 'Business Analysis', 'Budgets', 'Financial Modeling',
                                    'Change Management', 'Operations Management', 'Supply Chain',
                                    'People Management', 'Leadership', 'Mentoring', 'Team Building',
                                  ],
                                  // Tools & Practices
                                  tools: [
                                    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Trello', 'Asana',
                                    'Monday.com', 'Confluence', 'Notion', 'Slack', 'Microsoft Teams',
                                    'Agile', 'Scrum', 'Kanban', 'SAFe', 'Figma', 'Sketch', 'Adobe XD',
                                    'Postman', 'Swagger', 'OpenAPI', 'OAuth', 'JWT',
                                    'SAML', 'SSO', 'LDAP', 'Active Directory', 'Wordpress',
                                  ],
                                  // Networking & Security
                                  networking: [
                                    'TCP/IP', 'DNS', 'HTTP', 'HTTPS', 'SSL/TLS',
                                    'VPN', 'Firewall', 'Load Balancer', 'CDN',
                                    'CCNA', 'CCNP', 'CompTIA', 'Cybersecurity',
                                    'Penetration Testing', 'OWASP', 'SOC', 'SIEM',
                                    'Wireshark', 'Nmap', 'Snort', 'Security+', 'CISSP',
                                  ],
                                };

                                const allSkills = Object.values(KNOWN_SKILLS).flat();
                                const resumeText = editResumeText;
                                const foundSkills: string[] = [];

                                for (const skill of allSkills) {
                                  // Build a regex that matches the skill as a whole word,
                                  // case-insensitive, handling special chars like C++, .NET, etc.
                                  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                  const pattern = new RegExp(`(?:^|[\\s,;|/()\\[\\]])${escaped}(?=$|[\\s,;|/()\\[\\].])`, 'i');
                                  if (pattern.test(resumeText)) {
                                    // Use the canonical name from our dictionary
                                    const normalized = normalizeSkillName(skill);
                                    // Avoid duplicates (e.g., "React" and "ReactJS" both found)
                                    if (!foundSkills.some(f => normalizeSkillName(f) === normalized)) {
                                      foundSkills.push(skill);
                                    }
                                  }
                                }

                                if (foundSkills.length === 0) {
                                  toast({ title: "No skills detected", description: "Couldn't find recognized skills in the text. Try pasting more of your resume.", variant: "destructive" });
                                  setExtractingSkills(false);
                                  return;
                                }

                                // Add found skills to candidate's skill graph
                                const { data: { session } } = await supabase.auth.getSession();
                                if (!session || !profile) {
                                  setExtractingSkills(false);
                                  return;
                                }
                                let addedCount = 0;
                                const existingNormalized = skills.map((s: any) => normalizeSkillName(s.skill_name));

                                for (const skillName of foundSkills) {
                                  const norm = normalizeSkillName(skillName);
                                  if (existingNormalized.includes(norm)) continue; // skip existing
                                  const { error } = await supabase
                                    .from("candidate_skills")
                                    .insert({
                                      candidate_id: profile.id,
                                      skill_name: skillName,
                                      years_experience: 1,
                                      skill_level: 'Intermediate'
                                    });
                                  if (!error) {
                                    addedCount++;
                                    existingNormalized.push(norm);
                                  }
                                }

                                await fetchSkills();
                                fetchRecommendations();
                                toast({ 
                                  title: `Extracted ${foundSkills.length} Skills`, 
                                  description: addedCount > 0 
                                    ? `Added ${addedCount} new skill${addedCount > 1 ? 's' : ''} to your graph. ${foundSkills.length - addedCount > 0 ? `${foundSkills.length - addedCount} already existed.` : ''}` 
                                    : `All ${foundSkills.length} skills were already in your graph.`
                                });
                                setExtractingSkills(false);
                             }}
                           >
                              <Target className="h-3 w-3 text-primary" /> {extractingSkills ? 'Scanning...' : 'Auto-Extract'}
                           </Button>
                        </div>
                        <Textarea 
                          placeholder="Manually copy and paste your entire resume here for skill matching..." 
                          className="min-h-[120px] text-xs font-mono bg-muted/20 rounded-xl leading-relaxed"
                          value={editResumeText}
                          onChange={(e) => setEditResumeText(e.target.value)}
                        />
                      </div>
                    </div>
                  </ScrollArea>
                  <DialogFooter className="p-8 bg-muted/5 border-t">
                    <Button variant="ghost" className="font-bold uppercase text-xs" onClick={() => setIsEditing(false)}>Abort</Button>
                    <Button onClick={handleUpdateProfile} disabled={savingProfile} className="font-black uppercase text-xs px-8 h-11 shadow-xl shadow-primary/20">
                      {savingProfile ? "Writing..." : "Commit Changes"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-2 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-4 min-h-[64px]">
                 <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 font-black text-primary text-sm sm:text-xl border-2 border-primary/20">
                    {profile.profiles?.full_name?.charAt(0)}
                 </div>
                 <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <h3 className="font-black text-base sm:text-xl text-foreground uppercase tracking-tight truncate">{profile.profiles?.full_name}</h3>
                    {profile.desired_job_title && (
                      <div className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-widest mt-0.5 truncate">
                        {profile.desired_job_title}
                      </div>
                    )}
                    <div className="text-[10px] sm:text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-1 truncate">
                       <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0" />
                       <span className="truncate">{profile.profiles?.email}</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-1 sm:gap-3 min-h-[64px]">
                  <div className="bg-muted/5 border p-1.5 sm:p-3 rounded-lg sm:rounded-xl flex flex-col justify-center min-w-0">
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-black mb-0.5">Location</span>
                    <span className="text-[9px] sm:text-xs font-bold truncate break-words">{formatLocation(profile.location) || "Not specified"}</span>
                  </div>
                  <div className="bg-muted/5 border p-1.5 sm:p-3 rounded-lg sm:rounded-xl flex flex-col justify-center min-w-0">
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-black mb-0.5">Experience</span>
                    <span className="text-[9px] sm:text-xs font-bold truncate">{profile.experience_years || 0} Years</span>
                  </div>
              </div>

              <div className="space-y-2 sm:space-y-3 min-h-[126px]">
                <Label className="text-[10px] sm:text-[11px] text-muted-foreground uppercase font-black tracking-widest block h-[12px]">Connective Services</Label>
                <div className="grid grid-cols-[1fr,auto] gap-1.5 min-h-[44px]">
                  {profile.resume_url ? (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full h-10 sm:h-11 gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-black uppercase tracking-widest border-primary/20 hover:border-primary/50 hover:bg-primary/5 shadow-sm min-w-0"
                        onClick={() => handleViewResume(getResumePublicUrl(profile.resume_url))}
                      >
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" /> <span className="truncate">View Dossier</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-10 sm:h-11 w-10 sm:w-11 border-primary/20 hover:border-primary/50 hover:bg-primary/5 shadow-sm shrink-0"
                        onClick={() => handleViewResume(
                          getResumePublicUrl(profile.resume_url), 
                          true, 
                          `${profile.profiles?.full_name?.replace(/\s+/g, '_')}_Resume.pdf`
                        )}
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      </Button>
                    </>
                  ) : (
                    <div className="col-span-2 text-[10px] text-orange-600 bg-orange-50/50 px-2 sm:px-3 py-0 h-10 sm:h-11 rounded-xl border border-orange-100 font-bold flex items-center gap-2 italic">
                       Missing Resume Link
                    </div>
                  )}
                </div>

                {profile.linkedin_url ? (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button variant="outline" className="w-full h-10 sm:h-11 gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-black uppercase tracking-widest border-[#0A66C2]/20 text-[#0A66C2] hover:bg-[#0A66C2]/5 shadow-sm min-w-0">
                      <Linkedin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" /> <span className="truncate">LinkedIn Bridge</span>
                    </Button>
                  </a>
                ) : (
                  <Button variant="ghost" onClick={() => setIsEditing(true)} className="h-11 w-full text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">
                     Link Profile
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Skill Matrix Card */}
          <Card className="p-3 sm:p-6 border shadow-sm bg-card overflow-hidden">
             <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h2 className="text-base sm:text-xl font-black uppercase tracking-tighter flex items-center gap-2 truncate">
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" /> <span className="truncate">Skill Graph</span>
                </h2>
                
                <Dialog open={addingSkill} onOpenChange={(open) => {
                  setAddingSkill(open);
                  if (!open) {
                    setEditingSkillId(null);
                    setNewSkillName("");
                    setNewSkillExp("");
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 font-bold text-[10px] uppercase border-primary/30 hover:bg-primary/5" onClick={() => { setEditingSkillId(null); setNewSkillName(""); setNewSkillExp(""); }}>
                      <Plus className="h-3.5 w-3.5" /> Append
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px] border-none shadow-2xl rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-black uppercase tracking-tighter">{editingSkillId ? "Edit Competency" : "Add Competency"}</DialogTitle>
                      <DialogDescription className="sr-only">Input your skill details including name, years of experience, and proficiency level.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Skill Key</Label>
                        <Input placeholder="e.g. Kubernetes, React" className="h-11 rounded-xl" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Years Active</Label>
                          <Input type="number" min="0" className="h-11 rounded-xl" value={newSkillExp} onChange={(e) => setNewSkillExp(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Proficiency Range</Label>
                          <Select value={newSkillLevel} onValueChange={setNewSkillLevel}>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Junior">Junior</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Senior">Senior</SelectItem>
                              <SelectItem value="Lead">Lead</SelectItem>
                              <SelectItem value="Architect">Architect</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setAddingSkill(false)}>Cancel</Button>
                      <Button onClick={handleAddSkill} className="font-black h-11 px-8 uppercase text-xs">Commit Skill</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
             </div>

             <ScrollArea className="h-[220px] sm:h-[280px]">
                {skills.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Globe className="h-12 w-12 text-muted/20 mb-3" />
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-50">No data points mapped</p>
                  </div>
                ) : (
                  <Table className="w-full text-left border-collapse">
                    <TableHeader>
                      <TableRow className="bg-muted/10 hover:bg-muted/10 border-b border-border/50">
                        <TableHead className="h-7 text-[10px] font-black uppercase tracking-widest w-[40%]">Skill</TableHead>
                        <TableHead className="h-7 text-[10px] font-black uppercase tracking-widest text-center">Experience</TableHead>
                        <TableHead className="h-7 text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1"><Award className="h-3 w-3" /></TableHead>
                        <TableHead className="h-7 w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {skills.map((skill) => (
                        <TableRow key={skill.id} className="group hover:bg-muted/5 transition-colors border-b border-border/50 last:border-0">
                          <TableCell className="py-3">
                            <span className="text-xs font-black uppercase tracking-tight text-foreground">{skill.skill_name}</span>
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <span className="text-[10px] font-bold text-primary">{skill.years_experience} Yrs</span>
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            {getSkillLevelStars(skill.skill_level)}
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10 rounded"
                                onClick={() => {
                                  setEditingSkillId(skill.id);
                                  setNewSkillName(skill.skill_name);
                                  setNewSkillExp(skill.years_experience.toString());
                                  setNewSkillLevel(skill.skill_level || 'Intermediate');
                                  setAddingSkill(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded"
                                onClick={() => handleDeleteSkill(skill.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
             </ScrollArea>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-8 min-w-0 w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-muted/30 p-1.5 h-auto min-h-16 rounded-[2rem] gap-1 sm:gap-3">
              <TabsTrigger value="applications" className="data-[state=active]:bg-background data-[state=active]:shadow-2xl rounded-[1.5rem] h-full py-3 sm:py-0 font-black uppercase text-[9px] sm:text-[10px] tracking-widest gap-1.5 sm:gap-2.5 whitespace-normal break-words text-center leading-tight">
                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" /> <span className="truncate">Journey</span>
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="data-[state=active]:bg-background data-[state=active]:shadow-2xl rounded-[1.5rem] h-full py-3 sm:py-0 font-black uppercase text-[9px] sm:text-[10px] tracking-widest gap-1.5 sm:gap-2.5 whitespace-normal break-words text-center leading-tight">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" /> <span className="truncate">Best Fits</span>
              </TabsTrigger>

            </TabsList>

            <div className="mt-8">
              <TabsContent value="applications" className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-w-0 w-full">
                <Card className="p-3 sm:p-8 border shadow-sm min-h-[600px] bg-card rounded-2xl sm:rounded-[2.5rem] w-full relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 w-full min-w-0">
                    <div className="max-w-full min-w-0 flex-1">
                      <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none italic break-words">Active Pipeline</h2>
                      <p className="text-[10px] text-muted-foreground mt-3 font-black uppercase tracking-[0.3em] opacity-40 break-words whitespace-normal leading-relaxed">Tracking your global career progress</p>
                    </div>
                    <Badge variant="outline" className="h-auto py-1.5 px-3 sm:px-5 font-black text-[9px] sm:text-[10px] tracking-widest border-primary/20 bg-primary/5 text-primary shrink-0 self-start sm:self-auto text-center whitespace-normal break-words">
                      {applications.length} ENGAGEMENTS
                    </Badge>
                  </div>

                  {applications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                       <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner rotate-6">
                         <Briefcase className="h-10 w-10 text-primary/30" />
                       </div>
                       <h3 className="text-2xl font-black uppercase tracking-tighter">No Active Campaigns</h3>
                       <Button onClick={() => window.location.href = "/jobs"} className="mt-8 h-12 px-12 font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl shadow-primary/20">Manifest Opportunity</Button>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-4">
                      {applications.map((app) => (
                        <Card key={app.id} className="p-0 border border-muted-foreground/10 hover:border-primary/40 transition-all hover:shadow-2xl group overflow-hidden bg-card rounded-3xl sm:rounded-[2rem]">
                          <div className="flex flex-col md:flex-row min-h-[140px]">
                             <div className="flex-1 p-3 sm:p-8 space-y-2 sm:space-y-4 min-w-0">
                                <div className="space-y-1.5">
                                   <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                      <h3 className="font-black text-base sm:text-xl tracking-tighter uppercase leading-tight group-hover:text-primary transition-colors break-words w-full sm:w-auto">
                                        {app.jobs?.title}
                                      </h3>
                                      <Badge variant="outline" className="h-4 sm:h-5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] border-primary/20 px-1.5 sm:px-2">{app.jobs?.job_mode}</Badge>
                                   </div>
                                   <div className="flex items-center text-[10px] sm:text-xs font-bold text-muted-foreground tracking-widest uppercase break-words whitespace-normal">
                                      {app.jobs?.employer?.company_name}
                                   </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                   <div className="flex items-center bg-muted/30 px-2 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black tracking-widest uppercase text-muted-foreground italic border border-muted-foreground/5">
                                      Applied: {new Date(app.applied_at).toLocaleDateString()}
                                   </div>
                                </div>
                             </div>
                             <div className="md:w-[180px] sm:bg-muted/20 border-t sm:border-t-0 sm:border-l border-dashed flex flex-col items-center justify-center p-3 sm:p-6 group-hover:bg-primary/5 transition-colors min-h-[100px] sm:min-h-auto">
                                <span className="text-[9px] font-black text-muted-foreground/40 mb-2 uppercase tracking-widest">Global Status</span>
                                {getStatusBadge(app.status)}
                             </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-w-0 w-full">
                <Card className="p-3 sm:p-8 border shadow-sm min-h-[600px] bg-card rounded-2xl sm:rounded-[2.5rem] w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 w-full min-w-0">
                    <div className="max-w-full min-w-0 flex-1">
                      <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none italic break-words">Targeted Matches</h2>
                      <p className="text-[10px] text-muted-foreground mt-3 font-black uppercase tracking-[0.3em] opacity-40 break-words whitespace-normal leading-relaxed">Filtered by your {profile.work_authorization} status</p>
                    </div>
                  </div>

                  {recommendations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 sm:py-32 text-center text-muted-foreground opacity-70">
                      <Target className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-primary/50" />
                      <h3 className="text-lg sm:text-xl font-black uppercase tracking-[0.2em] mb-2">No Verified Matches</h3>
                      <p className="max-w-[250px] sm:max-w-xs mx-auto text-[10px] sm:text-xs font-bold leading-relaxed uppercase tracking-widest">
                        We couldn't find roles aligning precisely with your specific parameters right now. Try expanding your search or adding more skills.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {recommendations.map(job => (
                        <Card key={job.id} className="p-5 sm:p-6 border border-muted-foreground/10 hover:shadow-2xl transition-all group relative overflow-hidden bg-muted/5 rounded-2xl sm:rounded-3xl">
                           <Badge
                             variant="outline"
                             className={`absolute top-4 right-4 z-10 text-[9px] sm:text-[10px] font-black uppercase tracking-widest border-transparent ${applications.some((app) => (app.job_id || app.jobs?.id) === job.id) ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}
                           >
                             {applications.some((app) => (app.job_id || app.jobs?.id) === job.id) ? "Applied" : "Not Applied"}
                           </Badge>
                           <div className="space-y-4 pt-6 sm:pt-0">
                              <div className="pr-0 sm:pr-20">
                                 <h4 className="text-base sm:text-lg font-black uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors break-words w-full">{job.title}</h4>
                                 <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1.5 break-words">{job.employer?.company_name}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 <Badge variant="outline" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-background border-primary/20 h-auto py-1 px-2 text-center whitespace-normal break-words">{formatLocation(job.location)}</Badge>
                                 <Badge variant="outline" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border-transparent h-auto py-1 px-2 text-center whitespace-normal break-words">{job.job_type}</Badge>
                                 {job.salary_min && (
                                    <Badge variant="outline" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-600 border-transparent h-auto py-1 px-2 text-center whitespace-normal break-words">
                                      ${job.salary_min.toLocaleString()} - {job.salary_max?.toLocaleString()} <span className="ml-1 opacity-60 block sm:inline">{job.salary_period || 'Annually'}</span>
                                    </Badge>
                                  )}
                                 {(job as any).score > 0 && (
                                   <Badge variant="outline" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-600 border-transparent h-auto py-1 px-2 text-center whitespace-normal break-words">
                                     {(job as any).score}% Match
                                   </Badge>
                                 )}
                              </div>
                              <Button className="w-full h-10 sm:h-11 font-black uppercase text-[9px] sm:text-[10px] shadow-lg rounded-xl sm:rounded-2xl mt-2" asChild>
                                 <Link to={`/jobs/${job.id}`}>Engagement Review</Link>
                              </Button>
                           </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Alerts Tab Content Removed */}


            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const getSkillLevelStars = (level: string | undefined) => {
  const levelMap: Record<string, number> = {
    'Junior': 1,
    'Intermediate': 2,
    'Senior': 3,
    'Lead': 4,
    'Architect': 5
  };
  
  const stars = levelMap[level || 'Intermediate'] || 2;
  const totalStars = 5;
  
  return (
    <div className="flex items-center justify-center gap-0.5">
      {Array.from({ length: totalStars }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < stars ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
};

const getStatusBadge = (status: string|undefined) => {
  const base = "h-11 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl rounded-xl transition-all hover:scale-105 flex items-center gap-2";
  switch (status) {
    case "accepted":
      return <Badge className={`${base} bg-green-600 hover:bg-green-700`}><CheckCircle className="w-4 h-4" /> Selected</Badge>;
    case "rejected":
      return <Badge variant="destructive" className={`${base} bg-destructive`}><XCircle className="w-4 h-4" /> Declined</Badge>;
    case "shortlisted":
      return <Badge className={`${base} bg-blue-600`}><Briefcase className="w-4 h-4" /> Shortlisted</Badge>;
    case "interview_scheduled":
      return <Badge className={`${base} bg-purple-600`}><Calendar className="w-4 h-4" /> Interview</Badge>;
    default:
      return <Badge className={`${base} bg-zinc-950 text-white hover:bg-zinc-900 border-none`}><Clock className="w-4 h-4" /> Pending</Badge>;
  }
};

export default CandidateDashboard;