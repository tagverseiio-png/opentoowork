import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "./ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Briefcase, Users, Check, X, FileText, MapPin, 
  DollarSign, Power, Mail, Trash2, Ban, Upload, Pencil, Target, AlignLeft, Building2, Calendar, LayoutDashboard, Search, ExternalLink, Globe, ShieldCheck, MessageSquare, Terminal, Fingerprint, BadgeCheck, RefreshCw, Layers, Printer
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  HoverCard, HoverCardContent, HoverCardTrigger
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "./ui/separator";
import { sendStatusChangeNotification, calculateMatchScore } from "@/lib/email";

const WORK_AUTH_OPTIONS = [
  "H1B", "CPT-EAD", "OPT-EAD", "GC", "GC-EAD", "USC", "TN"
];

const JOB_MODE_OPTIONS = ["On-Site", "Hybrid", "Remote"];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "submitted_to_client", label: "Submitted to Client" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const PLANS = [
  { name: "Free", price: 0, jobs: 1, resumes: "No", features: ["1 Job Post", "Dashboard Access"] },
  { name: "Basic", price: 49, jobs: 10, resumes: "Limited", features: ["10 Job Posts", "Limited Candidate Search"] },
  { name: "Pro", price: 99, jobs: 50, resumes: "Full", features: ["50 Job Posts", "Full Resume Access", "Featured Jobs"] },
  { name: "Enterprise", price: 299, jobs: 999, resumes: "Full", features: ["Unlimited Posts", "Dedicated Support", "Full Analytics"] },
];

const EmployerDashboard = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [talentPool, setTalentPool] = useState<any[]>([]);
  const [talentLoading, setTalentLoading] = useState(false);
  const [talentSearch, setTalentSearch] = useState("");
  const [talentLocation, setTalentLocation] = useState("");
  const [talentVisa, setTalentVisa] = useState("All");
  const [talentExp, setTalentExp] = useState("All");

  // Profile Form States
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Job Form States
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobIdField, setJobIdField] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryPeriod, setSalaryPeriod] = useState("Yearly");
  const [jobType, setJobType] = useState("Full time");
  const [taxTerm, setTaxTerm] = useState("");
  const [jobMode, setJobMode] = useState("On-Site");
  const [expiresAt, setExpiresAt] = useState("");
  const [experienceRequired, setExperienceRequired] = useState("");
  const [benefits, setBenefits] = useState("");
  const [selectedWorkAuth, setSelectedWorkAuth] = useState<string[]>([]);
  
  // Job Skills Builder
  const [jobSkills, setJobSkills] = useState<{name: string, exp: string, isRequired: boolean}[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillExp, setNewSkillExp] = useState("");
  const [newSkillRequired, setNewSkillRequired] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchJobs();
    fetchSubscription();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("employer_profiles")
      .select("*, profiles(*)")
      .eq("user_id", session.user.id)
      .single();

    if (data) {
      setProfile(data);
      setEditCompanyName(data.company_name || "");
      setEditDescription(data.description || "");
      setEditWebsite(data.company_website || "");
      setEditLogoUrl(data.logo_url || "");
    }
  };

  const [editLogoUrl, setEditLogoUrl] = useState("");

  const fetchSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: employerProfile } = await supabase
      .from("employer_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (employerProfile) {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("employer_id", employerProfile.id)
        .maybeSingle();
      
      setSubscription(data);
    }
  };

  const fetchJobs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: employerProfile } = await supabase
      .from("employer_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (employerProfile) {
      const { data } = await supabase
        .from("jobs")
        .select(`
          *,
          job_skills(*),
          job_views:job_views(count),
          applications:applications(count)
        `)
        .eq("employer_id", employerProfile.id)
        .order("created_at", { ascending: false });

      setJobs(data || []);
    }
  };

  const fetchApplications = async (jobId: string) => {
    const { data } = await supabase
      .from("applications")
      .select(`
        *,
        candidate:candidate_profiles(
          *,
          candidate_skills(*),
          profiles(*)
        )
      `)
      .eq("job_id", jobId)
      .order('applied_at', { ascending: false });

    setApplications(data || []);
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      let finalLogoUrl = profile.logo_url;

      if (logoFile) {
        setUploadingLogo(true);
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `${session.user.id}/logo.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("company_logos")
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("company_logos")
          .getPublicUrl(filePath);
        finalLogoUrl = `${publicUrl}?t=${new Date().getTime()}`;
      }

      const { error } = await supabase
        .from("employer_profiles")
        .update({
          company_name: editCompanyName,
          description: editDescription,
          company_website: editWebsite,
          logo_url: editLogoUrl
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({ title: "Company profile updated!" });
      setIsProfileDialogOpen(false);
      setLogoFile(null);
      fetchProfile();
    } catch (error: any) {
      toast({ title: "Error updating", description: error.message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddJobSkill = () => {
    if (!newSkillName) return;
    setJobSkills([...jobSkills, { 
      name: newSkillName, 
      exp: newSkillExp || "0", 
      isRequired: newSkillRequired 
    }]);
    setNewSkillName("");
    setNewSkillExp("");
    setNewSkillRequired(true);
  };

  const handleRemoveJobSkill = (index: number) => {
    setJobSkills(jobSkills.filter((_, i) => i !== index));
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!editingJobId) {
      // Enforce subscription limits
      const plan = subscription?.plan_type || "Free";
      let limit = 1;
      if (plan === "Basic") limit = 10;
      else if (plan === "Professional") limit = 50;
      else if (plan === "Enterprise") limit = 9999;
      
      if (jobs.length >= limit) {
        toast({ 
          title: "Limit Exceeded", 
          description: `Your ${plan} plan only allows up to ${limit} active job postings. Please upgrade your subscription.`, 
          variant: "destructive" 
        });
        return;
      }
    }

    const jobData: any = {
      employer_id: profile.id,
      job_id: jobIdField,
      title,
      description,
      location,
      salary_min: salaryMin ? parseInt(salaryMin) : null,
      salary_max: salaryMax ? parseInt(salaryMax) : null,
      job_type: taxTerm ? `${jobType} - ${taxTerm}` : jobType,
      job_mode: jobMode,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      experience_required: experienceRequired ? parseInt(experienceRequired) : 0,
      work_authorization: selectedWorkAuth,
      salary_period: salaryPeriod,
    };

    let result;
    if (editingJobId) {
      result = await supabase.from("jobs").update(jobData).eq("id", editingJobId).select().single();
    } else {
      result = await supabase.from("jobs").insert(jobData).select().single();
    }

    const { data: jobResult, error } = result;

    if (error) {
      toast({ title: "Error saving job", description: error.message, variant: "destructive" });
      return;
    }

    // Handle Job Skills
    if (editingJobId) {
      await supabase.from("job_skills").delete().eq("job_id", editingJobId);
    }

    if (jobSkills.length > 0 && jobResult) {
      const skillsToInsert = jobSkills.map(s => ({
        job_id: jobResult.id,
        skill_name: s.name,
        years_experience: parseInt(s.exp) || 0,
        is_required: s.isRequired
      }));
      await supabase.from("job_skills").insert(skillsToInsert);
    }

    toast({ title: editingJobId ? "Job updated successfully!" : "Job published successfully!" });
    setIsDialogOpen(false);
    setEditingJobId(null);
    fetchJobs();

    // Reset Form
    resetJobForm();
  };

  const resetJobForm = () => {
    setEditingJobId(null);
    setJobIdField("");
    setTitle("");
    setDescription("");
    setLocation("");
    setSalaryMin("");
    setSalaryMax("");
    setExperienceRequired("");
    setSelectedWorkAuth([]);
    setJobMode("On-Site");
    setJobType("Full time");
    setTaxTerm("");
    setExpiresAt("");
    setBenefits("");
    setJobSkills([]);
  };

  const handleEditJob = (job: any) => {
    setEditingJobId(job.id);
    setJobIdField(job.job_id || "");
    setTitle(job.title || "");
    setDescription(job.description || "");
    setLocation(job.location || "");
    setSalaryMin(job.salary_min?.toString() || "");
    setSalaryMax(job.salary_max?.toString() || "");
    setSalaryPeriod(job.salary_period || "Yearly");
    
    if (job.job_type) {
      if (job.job_type.includes(" - ")) {
        const parts = job.job_type.split(" - ");
        setJobType(parts[0]);
        setTaxTerm(parts[1]);
      } else {
        setJobType(job.job_type);
        setTaxTerm("");
      }
    } else {
      setJobType("Full time");
      setTaxTerm("");
    }
    
    setJobMode(job.job_mode || "On-Site");
    setExperienceRequired(job.experience_required?.toString() || "");
    setSelectedWorkAuth(job.work_authorization || []);
    setBenefits(job.benefits || "");
    setExpiresAt(job.expires_at ? new Date(job.expires_at).toISOString().split('T')[0] : "");
    
    const mappedSkills = (job.job_skills || []).map((s: any) => ({
      name: s.skill_name,
      exp: s.years_experience?.toString() || "0",
      isRequired: s.is_required
    }));
    setJobSkills(mappedSkills);
    
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (jobId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("jobs")
      .update({ is_active: !currentStatus })
      .eq("id", jobId);

    if (error) {
      toast({ title: "Update failed", variant: "destructive" });
    } else {
      toast({ 
        title: !currentStatus ? "Job Activated" : "Job Deactivated",
      });
      fetchJobs();
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job deleted successfully" });
      fetchJobs();
    }
  };

  const updateApplicationStatus = async (appId: string, newStatus: string) => {
    // Find the application to get candidate details for email
    const app = applications.find(a => a.id === appId);

    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", appId);

    if (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    } else {
      toast({ 
        title: `Application marked as ${newStatus.replace('_', ' ')}`, 
      });
      if (selectedJob) fetchApplications(selectedJob.id);

      // Fire email notification to candidate (fire & forget)
      if (app?.candidate?.profiles?.email && selectedJob) {
        sendStatusChangeNotification(
          app.candidate.profiles.email,
          app.candidate.profiles.full_name || 'Candidate',
          selectedJob.title,
          newStatus
        );
      }
    }
  };

  const handleViewApplications = (job: any) => {
    setSelectedJob(job);
    fetchApplications(job.id);
  };

  const updateRecruiterNotes = async (appId: string, notes: string) => {
    const { error } = await supabase.from("applications").update({ recruiter_notes: notes }).eq("id", appId);
    if (!error) toast({ title: "Recruiter notes saved" });
  };

  const fetchTalent = async () => {
    setTalentLoading(true);
    let query = supabase
      .from("candidate_profiles")
      .select("*, profiles!inner(*), candidate_skills(*)")
      .eq("is_public", true);

    if (talentLocation) {
      query = query.ilike("location", `%${talentLocation}%`);
    }
    if (talentVisa !== "All") {
      query = query.eq("work_authorization", talentVisa);
    }
    if (talentExp !== "All") {
      const expValue = parseInt(talentExp);
      if (!isNaN(expValue)) query = query.gte("experience_years", expValue);
    }

    const { data } = await query.limit(50);
    
    let filteredData = data || [];
    if (talentSearch) {
      const term = talentSearch.toLowerCase();
      filteredData = filteredData.filter(d => 
        (d.profiles?.full_name?.toLowerCase() || "").includes(term) ||
        (d.candidate_skills || []).some((s:any) => s.skill_name?.toLowerCase().includes(term))
      );
    }

    setTalentPool(filteredData);
    setTalentLoading(false);
  };

  useEffect(() => {
    if (activeTab === "talent") fetchTalent();
  }, [activeTab]);

  const toggleWorkAuth = (auth: string) => {
    setSelectedWorkAuth(prev => 
      prev.includes(auth) ? prev.filter(a => a !== auth) : [...prev, auth]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-600 hover:bg-green-700 gap-1 pl-1.5"><CheckCircle className="w-3.5 h-3.5" /> Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1 pl-1.5"><XCircle className="w-3.5 h-3.5" /> Rejected</Badge>;
      case "shortlisted":
        return <Badge className="bg-blue-600 hover:bg-blue-700 gap-1 pl-1.5"><Star className="w-3.5 h-3.5" /> Shortlisted</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1 pl-1.5 bg-muted-foreground/10 text-muted-foreground border-transparent"><Clock className="w-3.5 h-3.5" /> Pending</Badge>;
    }
  };

  const handleDownloadProfile = (candidate: any) => {
    const printWindow = window.open('', '', 'width=800,height=900');
    if (!printWindow) {
      toast({ title: "Popup Blocked", description: "Please allow popups to print the candidate profile.", variant: "destructive" });
      return;
    }
    
    const htmlContent = `
      <html>
        <head>
          <title>${candidate?.profiles?.full_name} - Dossier</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            h1 { font-size: 28px; font-weight: 900; margin-bottom: 5px; text-transform: uppercase; letter-spacing: -1px; }
            h2 { font-size: 14px; color: #666; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 30px; }
            .meta { font-size: 12px; color: #444; margin-bottom: 30px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
            .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
            .skill-badge { background: #f4f4f5; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
            .resume-text { font-family: monospace; font-size: 12px; white-space: pre-wrap; background: #fafafa; padding: 20px; border-radius: 8px; border: 1px dashed #ccc; margin-top: 15px;}
          </style>
        </head>
        <body>
          <h1>${candidate?.profiles?.full_name || 'Candidate Profile'}</h1>
          <div class="meta">
            ${candidate?.profiles?.email || 'No Email'} • 
            ${candidate?.location || 'No Location'} • 
            ${candidate?.work_authorization || 'No Visa Specified'}
          </div>
          
          <h2>Expertise Matrix</h2>
          <div class="skills">
            ${(candidate?.candidate_skills || []).map((s:any) => `<div class="skill-badge">${s.skill_name} (${s.years_experience} YRS)</div>`).join('') || '<p>No specific skills listed.</p>'}
          </div>

          <h2>Extracted Profile Data (Raw)</h2>
          <div class="resume-text">${candidate?.resume_text || 'No raw text data provided by candidate.'}</div>
          
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!profile) return <div className="min-h-[50vh] flex items-center justify-center font-black uppercase tracking-widest text-[10px] text-muted-foreground animate-pulse">Initializing Employer Terminal...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          {profile.logo_url ? (
            <img src={profile.logo_url} alt="Company Logo" className="h-16 w-16 object-cover rounded-md border shadow-sm" />
          ) : (
            <div className="h-16 w-16 bg-muted border rounded-md flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{profile.company_name} Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
               <Badge variant="outline" className="text-xs font-normal border-primary/20 bg-primary/5 text-primary">Employer Portal</Badge>
               <span className="text-xs text-muted-foreground font-medium">Manage your job postings and applicants</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-muted p-1 rounded-lg mr-4">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              onClick={() => setActiveTab("dashboard")}
              className="h-8 text-[10px] font-black uppercase tracking-widest px-4"
            >
              Management
            </Button>
            <Button
              variant={activeTab === "talent" ? "default" : "ghost"}
              onClick={() => setActiveTab("talent")}
              className="h-8 text-[10px] font-black uppercase tracking-widest px-4 gap-2"
            >
              <Users className="h-3 w-3" /> Talent Pool
            </Button>
            <Button
              variant={activeTab === "subscription" ? "default" : "ghost"}
              onClick={() => setActiveTab("subscription")}
              className="h-8 text-[10px] font-black uppercase tracking-widest px-4 gap-2"
            >
              <DollarSign className="h-3 w-3" /> Subscription
            </Button>
          </div>

          <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 h-10 px-4 font-bold text-xs ring-offset-background transition-colors hover:bg-muted">
                <Pencil className="h-4 w-4" /> Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Edit Company Profile</DialogTitle>
                <DialogDescription>Update your company's name, website, and description.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Company Logo URL</Label>
                  <Input value={editLogoUrl} onChange={(e) => setEditLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className="resize-none" />
                </div>
              </div>
              <DialogFooter>
                 <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>Cancel</Button>
                 <Button onClick={handleUpdateProfile} disabled={uploadingLogo}>
                    {uploadingLogo ? "Saving..." : "Save Changes"}
                 </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) resetJobForm(); setIsDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg bg-gradient-to-br from-primary to-accent hover:opacity-95 h-10 px-6 font-bold text-sm">
                <Plus className="mr-2 h-5 w-5" /> Post New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
              <DialogHeader className="p-6 border-b bg-muted/5">
                <DialogTitle className="text-3xl font-black text-foreground">{editingJobId ? 'Update Role' : 'Launch New Role'}</DialogTitle>
                <DialogDescription className="text-sm font-medium">
                  {editingJobId ? 'Modify the specifics of your current listing.' : 'Define the next opportunity for top talent to join your mission.'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto px-6 custom-scrollbar min-h-0">
                <form id="job-form" onSubmit={handlePostJob} className="space-y-8 py-8">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Internal Job ID</Label>
                      <Input 
                        placeholder="OTW-2026-XXXX (Autogenerated)" 
                        value={jobIdField} 
                        onChange={(e) => setJobIdField(e.target.value)} 
                        className="bg-muted/30" 
                      />
                      <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest leading-none mt-1">Leave blank for automatic protocol assignment.</p>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Job Title *</Label>
                      <Input required placeholder="e.g. Lead Full Stack Architect" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Location *</Label>
                      <div className="flex gap-3">
                         <div className="relative flex-1">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input required placeholder="City, State" value={location} onChange={(e) => setLocation(e.target.value)} className="pl-10" />
                         </div>
                         <div className="w-[140px]">
                            <Select value={jobMode} onValueChange={setJobMode}>
                              <SelectTrigger className="bg-muted/30 font-bold text-xs uppercase tracking-tighter">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 {JOB_MODE_OPTIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                              </SelectContent>
                            </Select>
                         </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4 md:col-span-2">
                       <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Job Classification</Label>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Job Type</Label>
                            <ToggleGroup type="single" value={jobType} onValueChange={(val) => val && setJobType(val)} className="justify-start flex-wrap gap-2">
                               {["Full time", "Part time", "Contract", "Internship"].map(type => (
                                 <ToggleGroupItem key={type} value={type} variant="outline" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest border-muted-foreground/20 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                                   {type}
                                 </ToggleGroupItem>
                               ))}
                            </ToggleGroup>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Tax Terms</Label>
                            <ToggleGroup type="single" value={taxTerm} onValueChange={(val) => val && setTaxTerm(val)} className="justify-start flex-wrap gap-2">
                               {["W2", "C2C", "1099"].map(type => (
                                 <ToggleGroupItem key={type} value={type} variant="outline" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest border-muted-foreground/20 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                                   {type}
                                 </ToggleGroupItem>
                               ))}
                            </ToggleGroup>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Role Description & Responsibilities *</Label>
                    <Textarea required rows={8} placeholder="Dive deep into the expectations, company culture, and mandatory qualifications..." value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none leading-relaxed" />
                  </div>



                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="p-5 border rounded-xl bg-gradient-to-br from-primary/5 to-transparent border-primary/10 space-y-6">
                        <Label className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.2em]"><Target className="h-4 w-4" /> Expertise Requirements</Label>
                        
                        <div className="space-y-4">
                           <div className="space-y-2">
                              <Label className="text-xs font-bold text-foreground">Add Mandatory/Preferred Skills</Label>
                              <div className="flex gap-2">
                                 <Input placeholder="Skill (e.g. Kubernetes)" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} className="bg-background" />
                                 <Input placeholder="Years" type="number" value={newSkillExp} onChange={(e) => setNewSkillExp(e.target.value)} className="w-20 bg-background" />
                                 <div className="flex flex-col items-center justify-center px-1">
                                    <span className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-1">REQ</span>
                                    <Switch checked={newSkillRequired} onCheckedChange={setNewSkillRequired} className="scale-75" />
                                 </div>
                                 <Button type="button" variant="secondary" onClick={handleAddJobSkill} className="font-extrabold h-10 px-4">
                                    <Plus className="h-4 w-4" />
                                 </Button>
                              </div>
                           </div>

                           <div className="min-h-[100px] bg-background/50 rounded-lg p-3 border border-dashed border-primary/20 flex flex-wrap gap-2 content-start">
                              {jobSkills.length > 0 ? (
                                 jobSkills.map((s, idx) => (
                                    <Badge key={idx} variant={s.isRequired ? 'default' : 'secondary'} className="h-8 pl-3 pr-1 gap-1.5 font-bold text-[10px] items-center border-transparent shadow-sm">
                                       <span className="uppercase">{s.name}</span>
                                       <span className="opacity-60 tabular-nums">{s.exp}Y+</span>
                                       <button type="button" onClick={() => handleRemoveJobSkill(idx)} className="h-6 w-6 rounded-md hover:bg-black/10 flex items-center justify-center transition-colors">
                                          <X className="h-3 w-3" />
                                       </button>
                                    </Badge>
                                 ))
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-muted-foreground italic">
                                    Skill requirements will appear here...
                                 </div>
                              )}
                           </div>
                        </div>

                        <div className="space-y-4">
                           <Label className="text-xs font-bold text-foreground">Target Experience & Timeline</Label>
                           <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1.5">
                                 <span className="text-muted-foreground">General Years Experience</span>
                                 <Input type="number" min="0" placeholder="e.g. 5" value={experienceRequired} onChange={(e) => setExperienceRequired(e.target.value)} className="bg-background" />
                              </div>
                              <div className="space-y-1.5">
                                 <span className="text-muted-foreground">Listing Expiry Date</span>
                                 <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="bg-background cursor-pointer" />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="p-5 border rounded-xl bg-muted/5 space-y-6">
                        <Label className="flex items-center gap-2 font-black uppercase text-[10px] tracking-[0.2em]"><DollarSign className="h-4 w-4 text-green-500" /> Compensation & Compliance</Label>
                        
                        <div className="space-y-4">
                           <div className="space-y-2">
                              <Label className="text-xs font-bold text-foreground">Budgeted Salary Range (Annual USD)</Label>
                               <div className="flex items-center gap-3">
                                 <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                    <Input type="number" placeholder="Min" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className="bg-background pl-6 text-xs h-9" />
                                 </div>
                                 <Separator className="w-4 h-[2px] bg-muted-foreground/20" />
                                 <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                    <Input type="number" placeholder="Max" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className="bg-background pl-6 text-xs h-9" />
                                 </div>
                                 <Select value={salaryPeriod} onValueChange={setSalaryPeriod}>
                                    <SelectTrigger className="w-24 h-9 bg-background text-[10px] font-black uppercase">
                                       <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                       {["Hourly", "Monthly", "Yearly"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                 </Select>
                              </div>
                            </div>
                           <div className="space-y-3">
                              <Label className="text-xs font-bold text-foreground">Eligible Work Authorizations *</Label>
                              <div className="grid grid-cols-2 gap-3 p-3 bg-background rounded-lg border border-muted/50">
                                 {WORK_AUTH_OPTIONS.map((auth) => (
                                    <div key={auth} className="flex items-center space-x-2.5">
                                       <Checkbox 
                                          id={`wa-${auth}`} 
                                          checked={selectedWorkAuth.includes(auth)}
                                          onCheckedChange={() => toggleWorkAuth(auth)}
                                          className="data-[state=checked]:bg-primary border-muted-foreground/40"
                                       />
                                       <label htmlFor={`wa-${auth}`} className="text-[10px] font-black uppercase tracking-widest cursor-pointer select-none">
                                          {auth}
                                       </label>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                </form>
              </div>

              <DialogFooter className="p-6 border-t bg-muted/5 shrink-0 flex items-center justify-between sm:justify-between w-full">
                 <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <LayoutDashboard className="h-3 w-3" />
                    <span>Real-time preview enabled</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold text-xs uppercase tracking-widest px-6 h-11">Discard</Button>
                   <Button form="job-form" type="submit" className="bg-primary hover:bg-primary/90 h-11 px-10 font-black uppercase tracking-[0.1em] shadow-xl text-xs">
                     {editingJobId ? 'Apply Changes' : 'Confirm & Publish'}
                   </Button>
                 </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {activeTab === "dashboard" ? (
        <div className="grid lg:grid-cols-12 gap-8 mt-12">
          {/* Statistics or Sidebar could go here */}

          <div className="lg:col-span-12 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                  <Briefcase className="h-7 w-7 text-primary" /> 
                  Listings Management
                  <Badge className="ml-2 bg-primary/10 text-primary border-transparent h-6 tabular-nums">{jobs.length}</Badge>
                </h2>
                
                {subscription && (
                  <div className="flex items-center gap-4 bg-muted/30 px-4 py-2 rounded-xl border">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Job Usage</span>
                       <span className="text-sm font-black tabular-nums">{subscription.job_posts_count} / {subscription.job_posts_limit}</span>
                    </div>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-primary" 
                         style={{ width: `${Math.min((subscription.job_posts_count / subscription.job_posts_limit) * 100, 100)}%` }}
                       />
                    </div>
                  </div>
                )}
            </div>

            {jobs.length === 0 ? (
              <Card className="p-20 text-center border-dashed bg-muted/5 rounded-2xl flex flex-col items-center justify-center group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                  <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform duration-500">
                    <Briefcase className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Zero Active Engagements</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm font-medium">Your portfolio of opportunities is currently empty. Start recruiting top-tier talent today.</p>
                  <Button 
                    onClick={() => {
                      if (subscription && subscription.job_posts_count >= subscription.job_posts_limit) {
                        toast({ title: "Limit Reached", description: "Please upgrade your plan to post more jobs.", variant: "destructive" });
                        setActiveTab("subscription");
                      } else {
                        setIsDialogOpen(true);
                      }
                    }} 
                    className="mt-8 gap-2 px-8 font-black uppercase tracking-widest text-[11px] h-12 shadow-xl"
                  >
                    <Plus className="h-4 w-4" /> Create First Listing
                  </Button>
              </Card>
            ) : (
              <div className="grid gap-6">
                {jobs.map(job => (
                  <Card key={job.id} className={`p-0 border hover:shadow-2xl transition-all duration-300 group overflow-hidden rounded-2xl ${job.is_active ? 'border-primary/10' : 'bg-muted/5 opacity-80'}`}>
                    <div className="flex flex-col md:flex-row min-h-[160px]">
                        {/* Left Side: Info */}
                        <div className="flex-1 p-6 flex flex-col justify-between">
                          <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-3">
                                      <span className="text-[9px] font-black uppercase text-primary/60 tracking-[0.2em] bg-primary/5 px-2 py-0.5 rounded border border-primary/10 tabular-nums">
                                          {job.job_id || "NOT-ID-SET"}
                                      </span>
                                      <Badge variant="outline" className={`h-5 text-[9px] font-black uppercase tracking-tighter ${job.is_active ? 'border-green-500/30 text-green-600 bg-green-50' : 'border-muted-foreground/30 text-muted-foreground'}`}>
                                          {job.is_active ? 'Active' : 'Draft/Closed'}
                                      </Badge>
                                    </div>
                                    <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-tight tracking-tighter">
                                      {job.title}
                                    </h3>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-x-6 gap-y-3">
                                 <div className="flex items-center text-xs font-bold text-muted-foreground">
                                    <MapPin className="h-4 w-4 mr-2 text-primary/40" />
                                    <span className="uppercase tracking-widest">{job.location}</span>
                                    <Badge className="ml-2 h-4 text-[8px] bg-muted/40 text-muted-foreground uppercase font-black">{job.job_mode}</Badge>
                                 </div>
                                 <div className="flex items-center text-xs font-bold text-muted-foreground">
                                    <Users className="h-4 w-4 mr-2 text-primary/40" />
                                    <span className="uppercase tracking-widest">{job.job_views?.[0]?.count || 0} Views</span>
                                 </div>
                                 <div className="flex items-center text-xs font-bold text-muted-foreground">
                                    <FileText className="h-4 w-4 mr-2 text-primary/40" />
                                    <span className="uppercase tracking-widest">{job.applications?.[0]?.count || 0} Apps</span>
                                 </div>
                                <div className="flex items-center text-xs font-bold text-muted-foreground">
                                    <Briefcase className="h-4 w-4 mr-2 text-primary/40" />
                                    <span className="uppercase tracking-widest">{job.job_type}</span>
                                </div>
                                {job.salary_min && (
                                  <div className="flex items-center text-xs font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200/50">
                                      <DollarSign className="h-3.5 w-3.5 mr-1" />
                                      <span className="tabular-nums">${job.salary_min.toLocaleString()} - ${job.salary_max?.toLocaleString()}</span>
                                  </div>
                                )}
                                {job.expires_at && (
                                  <div className="flex items-center text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/50">
                                      <Clock className="h-3.5 w-3.5 mr-2" />
                                      <span className="tabular-nums">EXP: {new Date(job.expires_at).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                          </div>
                          
                          {/* Job Skills Row */}
                          {job.job_skills && job.job_skills.length > 0 && (
                              <div className="mt-6 flex flex-wrap gap-2">
                                {job.job_skills.slice(0, 5).map((s: any) => (
                                    <span key={s.id} className={`text-[9px] font-black uppercase px-2 py-1 rounded relative overflow-hidden ${s.is_required ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-muted-foreground/10'}`}>
                                      {s.skill_name}
                                    </span>
                                ))}
                                {job.job_skills.length > 5 && (
                                    <span className="text-[9px] font-bold text-muted-foreground self-center ml-1">+{job.job_skills.length - 5} more</span>
                                )}
                              </div>
                          )}
                        </div>

                        {/* Right Side: Dashboard Stats & Actions */}
                        <div className="w-full md:w-[280px] bg-muted/10 border-l border-dashed group-hover:bg-primary/5 transition-colors duration-500 overflow-hidden flex flex-col divide-y divide-dashed">
                          <div className="flex-1 p-6 flex items-center justify-between">
                              <div className="space-y-0.5 text-center flex-1">
                                <div className="text-3xl font-black text-foreground tabular-nums leading-none tracking-tighter">
                                    {/* In a real app, you'd fetch applicant count here. For now we use the fetched applications if we have them, but here we just show a static placeholder or fetch it */}
                                    -
                                </div>
                                <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-2">Pipeline</div>
                              </div>
                              <Button 
                                onClick={() => handleViewApplications(job)} 
                                className="bg-black text-white hover:bg-black/90 h-12 ml-4 px-6 gap-2 rounded-xl shadow-xl shadow-black/10 group-hover:scale-105 transition-all"
                              >
                                <Users className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Candidates</span>
                              </Button>
                          </div>

                          <div className="p-4 grid grid-cols-4 gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditJob(job)}
                                className="bg-background shadow-sm hover:scale-110 active:scale-95 transition-all text-primary hover:text-primary hover:bg-primary/5"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleActive(job.id, job.is_active)}
                                className={`bg-background shadow-sm hover:scale-110 active:scale-95 transition-all ${job.is_active ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                              >
                                {job.is_active ? <Ban className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                              </Button>
                              <div className="col-span-1" /> {/* Spacer */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="bg-background shadow-sm hover:scale-110 active:scale-95 transition-all text-destructive hover:text-destructive hover:bg-destructive/5">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                                  <AlertDialogHeader>
                                    <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-4">
                                      <Trash2 className="h-6 w-6 text-destructive" />
                                    </div>
                                    <AlertDialogTitle className="text-xl font-black uppercase tracking-tighter">Terminate Listing?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm font-medium">
                                      Are you certain? This action permenantly removes <span className="text-foreground font-bold">"{job.title}"</span> and all historical applicant data. This cannot be reversed.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="mt-8">
                                    <AlertDialogCancel className="font-bold text-xs uppercase tracking-widest border-none hover:bg-muted">Recall</AlertDialogCancel>
                                    <AlertDialogAction 
                                      className="bg-destructive hover:bg-destructive/90 font-black text-xs uppercase tracking-widest h-11 px-8 shadow-lg shadow-destructive/20"
                                      onClick={() => handleDeleteJob(job.id)}
                                    >
                                      Confirm Deletion
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                          </div>
                        </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-12 space-y-8">
           <div className="bg-primary/5 border border-primary/10 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2">
                 <h2 className="text-3xl font-black uppercase tracking-tighter">Your Subscription</h2>
                 <p className="text-muted-foreground font-medium">Currently on the <Badge className="bg-primary text-white font-black">{subscription?.plan_type || 'Free'}</Badge> Tier</p>
                 <div className="flex items-center gap-6 mt-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Postings Used</span>
                      <span className="text-2xl font-black tabular-nums">{subscription?.job_posts_count || 0} / {subscription?.job_posts_limit || 1}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Resume Access</span>
                      <span className="text-lg font-black">{subscription?.resume_access || 'No'}</span>
                    </div>
                 </div>
              </div>
              <Button size="lg" className="h-14 px-10 rounded-xl font-black uppercase tracking-[0.1em] shadow-2xl shadow-primary/20 bg-gradient-to-r from-primary to-accent">
                 Current Plan Active
              </Button>
           </div>

           <div className="grid md:grid-cols-4 gap-6">
              {PLANS.map((plan) => (
                <Card key={plan.name} className={`p-6 border flex flex-col justify-between hover:shadow-2xl transition-all ${plan.name === subscription?.plan_type ? 'ring-2 ring-primary border-transparent' : 'bg-card'}`}>
                   <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{plan.price === 0 ? 'Free Entry' : 'Growth Plan'}</span>
                        {plan.name === "Pro" && <Badge className="bg-primary hover:bg-primary shadow-lg scale-90">Popular</Badge>}
                      </div>
                      <h3 className="text-2xl font-black tracking-tight mb-4">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mb-8">
                         <span className="text-4xl font-black tabular-nums">${plan.price}</span>
                         <span className="text-xs text-muted-foreground font-bold">/month</span>
                      </div>
                      
                      <ul className="space-y-4 mb-8">
                         {plan.features.map(f => (
                           <li key={f} className="flex items-center gap-2 text-xs font-bold text-foreground">
                              <Check className="h-4 w-4 text-green-500" /> {f}
                           </li>
                         ))}
                      </ul>
                   </div>
                   
                   <Button 
                    variant={plan.name === subscription?.plan_type ? "outline" : "default"}
                    disabled={plan.name === subscription?.plan_type}
                    className="w-full h-11 font-black uppercase tracking-widest text-[10px]"
                    onClick={() => toast({ title: "Coming Soon", description: "Payment gateway integration is currently on hold as requested." })}
                   >
                      {plan.name === subscription?.plan_type ? "Current Plan" : `Select ${plan.name}`}
                   </Button>
                </Card>
              ))}
           </div>
        </div>
      )}

      {/* Applications Dialog */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
            <DialogHeader className="p-8 border-b bg-muted/10 shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Users className="h-32 w-32" />
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                   <Badge variant="outline" className="mb-3 text-[9px] font-black uppercase tracking-[0.2em] border-primary/30 text-primary">Workforce Pipeline</Badge>
                   <DialogTitle className="text-4xl font-black text-foreground tracking-tighter leading-none">
                     Talent for <span className="text-primary">{selectedJob.title}</span>
                   </DialogTitle>
                </div>
                <div className="text-right">
                   <div className="text-3xl font-black tabular-nums">{applications.length}</div>
                   <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Total Applicants</div>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden bg-background">
              <Tabs defaultValue="list" className="h-full flex flex-col">
                <div className="px-8 border-b bg-muted/5">
                  <TabsList className="bg-transparent h-12 gap-6 p-0">
                    <TabsTrigger value="list" className="h-12 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none font-black uppercase tracking-widest text-[10px]">Applicants Pipeline</TabsTrigger>
                    <TabsTrigger value="notes" className="h-12 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none font-black uppercase tracking-widest text-[10px]">Recruiter Notes</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="list" className="flex-1 overflow-hidden mt-0">
                  {applications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-24 text-center">
                      <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                        <Users className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                      <h3 className="text-2xl font-bold">No candidates found</h3>
                      <p className="text-muted-foreground max-w-xs mt-2 font-medium">As soon as candidates apply to this role, they will appear in this consolidated pipeline view.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-full w-full">
                       <div className="p-8">
                          <Table>
                            <TableHeader className="bg-muted/5 border-none">
                              <TableRow className="hover:bg-transparent border-b-2">
                                <TableHead className="w-[300px] text-[10px] font-black uppercase tracking-widest py-6">Candidate Information</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Skill Alignment</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Supporting Material</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Resume</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">ATS Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {applications.map((app) => (
                                <TableRow key={app.id} className="hover:bg-muted/10 transition-colors border-b">
                                  <TableCell className="py-6">
                                    <div className="space-y-4">
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs border border-primary/20">
                                             {app.candidate?.profiles?.full_name?.charAt(0)}
                                          </div>
                                          <div>
                                             <div className="font-black text-base text-foreground tracking-tight leading-none uppercase">{app.candidate?.profiles?.full_name}</div>
                                             <div className="text-xs text-muted-foreground font-medium mt-1">{app.candidate?.profiles?.email}</div>
                                          </div>
                                       </div>
                                       <div className="flex flex-wrap gap-2">
                                          {app.candidate?.linkedin_url && (
                                             <a href={app.candidate.linkedin_url} target="_blank" rel="noreferrer">
                                                <Button variant="outline" size="sm" className="h-7 px-3 gap-1.5 text-[9px] font-bold border-blue-200 text-[#0A66C2] bg-[#0A66C2]/5 hover:bg-[#0A66C2]/10 transition-all">
                                                   <Linkedin className="h-3 w-3" /> LinkedIn
                                                </Button>
                                             </a>
                                          )}
                                          <div className="h-7 px-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-muted/40 text-muted-foreground rounded">
                                             <Calendar className="h-3 w-3" /> {new Date(app.applied_at).toLocaleDateString()}
                                          </div>
                                       </div>
                                    </div>
                                  </TableCell>
                                  
                                  <TableCell className="py-6">
                                    <div className="space-y-3">
                                       <div className="flex gap-2">
                                          <Badge className="bg-blue-600/10 text-blue-600 border-transparent text-[10px] uppercase font-black tracking-tighter">
                                             {app.candidate?.work_authorization}
                                          </Badge>
                                          <Badge variant="outline" className="text-[10px] uppercase font-black tracking-tighter tabular-nums bg-background">
                                             {app.candidate?.experience_years ? `${app.candidate.experience_years}Y PROF EXP` : "ENTRY LEVEL"}
                                          </Badge>
                                       </div>
                                       <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                                          {app.candidate?.candidate_skills && app.candidate.candidate_skills.slice(0, 4).map((s: any) => (
                                             <span key={s.id} className="text-[9px] bg-primary/5 text-primary border border-primary/10 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-tighter">
                                                {s.skill_name}
                                             </span>
                                          ))}
                                          {app.candidate?.candidate_skills && app.candidate.candidate_skills.length > 4 && (
                                             <span className="text-[9px] text-muted-foreground font-bold flex items-center">+{app.candidate.candidate_skills.length - 4}</span>
                                          )}
                                       </div>
                                    </div>
                                  </TableCell>

                                  <TableCell className="py-6">
                                    {app.cover_letter ? (
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button variant="ghost" className="h-9 px-3 gap-2 text-xs font-bold hover:bg-primary/5 border hover:border-primary/20">
                                             <AlignLeft className="h-3.5 w-3.5 text-primary" /> 
                                             <span className="uppercase tracking-widest">Read Note</span>
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl border-none shadow-2xl rounded-2xl p-0 overflow-hidden">
                                           <div className="bg-primary/5 p-8 border-b">
                                              <div className="flex items-center gap-3 mb-4">
                                                 <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                                    <Mail className="h-6 w-6 text-primary" />
                                                 </div>
                                                 <div>
                                                    <h4 className="font-black text-xl tracking-tighter uppercase">Message from Candidate</h4>
                                                    <p className="text-xs text-muted-foreground font-medium">Applicant: {app.candidate?.profiles?.full_name}</p>
                                                 </div>
                                              </div>
                                           </div>
                                           <ScrollArea className="h-[400px] p-8 font-inter">
                                              <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap italic">
                                                "{app.cover_letter}"
                                              </p>
                                           </ScrollArea>
                                        </DialogContent>
                                      </Dialog>
                                    ) : (
                                      <span className="text-xs text-muted-foreground font-black uppercase opacity-20 tracking-widest">No Statement</span>
                                    )}
                                  </TableCell>

                                  <TableCell className="py-6">
                                    <div className="flex flex-col gap-2">
                                       {app.candidate?.resume_url && (
                                         <a href={app.candidate.resume_url} target="_blank" rel="noopener noreferrer">
                                           <Button variant="outline" className="w-full h-8 px-4 gap-2 text-[10px] font-black uppercase tracking-[0.2em] border-primary/20 hover:bg-primary/5 hover:border-primary/50 text-foreground transition-all">
                                              <FileText className="w-3.5 h-3.5 text-primary" /> View
                                           </Button>
                                         </a>
                                       )}
                                       {app.candidate?.resume_text && (
                                          <Dialog>
                                             <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                                                   <LayoutDashboard className="w-3.5 h-3.5" /> Parsed Text
                                                </Button>
                                             </DialogTrigger>
                                             <DialogContent className="max-w-4xl border-none shadow-2xl rounded-2xl p-0 overflow-hidden">
                                                <div className="p-6 border-b bg-muted/5 flex items-center justify-between">
                                                   <div>
                                                     <h4 className="font-black text-xl uppercase tracking-tighter">Raw Resume Content</h4>
                                                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Full text extraction from candidate profile</p>
                                                   </div>
                                                   <Button 
                                                     variant="outline" 
                                                     onClick={() => handleDownloadProfile(app.candidate)} 
                                                     className="h-10 text-[10px] font-black uppercase tracking-widest gap-2"
                                                   >
                                                     <Printer className="w-3.5 h-3.5" /> Print PDF
                                                   </Button>
                                                </div>
                                                <ScrollArea className="h-[70vh] p-8 bg-zinc-950 text-zinc-300 font-mono text-xs leading-relaxed">
                                                   {app.candidate.resume_text}
                                                </ScrollArea>
                                             </DialogContent>
                                          </Dialog>
                                       )}
                                    </div>
                                  </TableCell>

                                  <TableCell className="py-6">
                                     <Select 
                                        value={app.status} 
                                        onValueChange={(val) => updateApplicationStatus(app.id, val)}
                                     >
                                        <SelectTrigger className="h-10 w-[200px] text-[10px] font-black uppercase tracking-widest border-none bg-muted/50 focus:ring-0 shadow-sm rounded-lg hover:bg-muted/80 transition-colors">
                                           <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-none shadow-2xl rounded-xl">
                                           {STATUS_OPTIONS.map(opt => (
                                              <SelectItem key={opt.value} value={opt.value} className="text-[10px] font-black uppercase tracking-widest focus:bg-primary focus:text-white transition-colors cursor-pointer">
                                                 {opt.label}
                                              </SelectItem>
                                           ))}
                                        </SelectContent>
                                     </Select>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                        </Table>
                     </div>
                  </ScrollArea>
                )}
              </TabsContent>
              <TabsContent value="notes" className="flex-1 overflow-hidden bg-background mt-0 p-8">
                <div className="h-full flex flex-col">
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Internal Recruiter Notes</h3>
                  <p className="text-sm text-muted-foreground mb-6">Add private notes about candidates for your team. These notes are not visible to applicants.</p>
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-6">
                      {applications.map((app) => (
                        <div key={app.id} className="border p-4 rounded-lg bg-muted/5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs border border-primary/20">
                              {app.candidate?.profiles?.full_name?.charAt(0)}
                            </div>
                            <div className="font-black text-sm uppercase tracking-tight">{app.candidate?.profiles?.full_name}</div>
                          </div>
                          <Textarea
                            placeholder="Add internal notes about this candidate..."
                            value={app.recruiter_notes || ''}
                            onChange={(e) => updateRecruiterNotes(app.id, e.target.value)}
                            className="min-h-[80px] text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          </DialogContent>
        </Dialog>
      )}

      {activeTab === "talent" && (
        <div className="mt-8 space-y-6 animate-in fade-in duration-500">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                 <Users className="h-7 w-7 text-primary" /> Verified Talent Pool
              </h2>
           </div>

           <div className="flex flex-col md:flex-row gap-3 bg-muted/20 p-4 rounded-xl border border-dashed border-border/60 shadow-inner">
              <Input 
                 placeholder="Search Skill or Name..." 
                 className="flex-1 bg-background h-11" 
                 value={talentSearch} 
                 onChange={(e) => setTalentSearch(e.target.value)} 
              />
              <Input 
                 placeholder="Search Location..." 
                 className="w-full md:w-48 bg-background h-11" 
                 value={talentLocation} 
                 onChange={(e) => setTalentLocation(e.target.value)} 
              />
              <Select value={talentVisa} onValueChange={setTalentVisa}>
                 <SelectTrigger className="w-full md:w-36 bg-background h-11"><SelectValue placeholder="Visa" /></SelectTrigger>
                 <SelectContent>
                    <SelectItem value="All">All Visas</SelectItem>
                    {WORK_AUTH_OPTIONS.map(auth => <SelectItem key={auth} value={auth}>{auth}</SelectItem>)}
                 </SelectContent>
              </Select>
              <Select value={talentExp} onValueChange={setTalentExp}>
                 <SelectTrigger className="w-full md:w-36 bg-background h-11"><SelectValue placeholder="Experience" /></SelectTrigger>
                 <SelectContent>
                    <SelectItem value="All">Any Exp.</SelectItem>
                    <SelectItem value="1">1+ Years</SelectItem>
                    <SelectItem value="3">3+ Years</SelectItem>
                    <SelectItem value="5">5+ Years</SelectItem>
                    <SelectItem value="10">10+ Years</SelectItem>
                 </SelectContent>
              </Select>
              <Button onClick={fetchTalent} className="h-11 px-8 font-black uppercase text-xs tracking-widest shadow-lg">Scan Database</Button>
           </div>

           {talentLoading ? (
             <div className="py-20 text-center animate-pulse text-muted-foreground uppercase font-black text-xs tracking-widest leading-none">Accessing Global Candidate Registry...</div>
           ) : (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {talentPool.map(talent => (
                  <Card key={talent.id} className="p-6 border hover:border-primary/30 transition-all group rounded-2xl bg-card">
                     <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                           <div className="space-y-1">
                              <h3 className="font-black text-lg leading-tight uppercase tracking-tighter">{talent.profiles?.full_name}</h3>
                              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">{talent.work_authorization} • {talent.experience_years}Y EXP</p>
                           </div>
                           <Badge className="bg-primary/10 text-primary border-transparent tabular-nums text-xs font-black">
                             {(() => {
                               // Real math-based match score using the first active job's skills
                               const activeJobWithSkills = jobs.find(j => j.is_active && j.job_skills?.length > 0);
                               if (!activeJobWithSkills || !talent.candidate_skills?.length) return '—';
                               const score = calculateMatchScore(talent.candidate_skills, activeJobWithSkills.job_skills);
                               return `${score}% MATCH`;
                             })()}
                           </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 h-20 content-start">
                           {talent.candidate_skills?.map((s: any) => (
                             <span key={s.id} className="text-[9px] font-black bg-muted px-2 py-1 rounded-sm uppercase tracking-tighter">
                                {s.skill_name}
                             </span>
                           ))}
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-dashed">
                           {talent.resume_url && (
                             <a href={talent.resume_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                               <Button variant="outline" className="w-full h-10 font-black uppercase text-[10px] tracking-widest gap-2">
                                  <FileText className="h-3.5 w-3.5" /> Dossier
                               </Button>
                             </a>
                           )}
                           <Button variant="ghost" className="flex-1 h-10 font-bold uppercase text-[10px] tracking-widest border border-transparent hover:border-primary/20">Profile</Button>
                        </div>
                     </div>
                  </Card>
                ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

// Internal components for status badges in dashboard
const CheckCircle = ({ className }: { className?: string }) => <Check className={className} />;
const XCircle = ({ className }: { className?: string }) => <X className={className} />;
const Star = ({ className }: { className?: string }) => <Target className={className} />;
const Clock = ({ className }: { className?: string }) => <Calendar className={className} />;
const Linkedin = ({ className }: { className?: string }) => <div className={className}><svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></div>;

export default EmployerDashboard;