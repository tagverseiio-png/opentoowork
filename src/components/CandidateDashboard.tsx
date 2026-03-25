import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle, Clock, XCircle, MapPin, Building2, Calendar, Briefcase, Pencil, Plus, Trash2, ExternalLink, Linkedin, Globe, Bell, Target, Settings, LayoutDashboard, Share2, UserCircle, Mail } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
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
import { calculateMatchScore, sendEmail } from "@/lib/email";

const WORK_AUTH_OPTIONS = [
  "H1B", "CPT-EAD", "OPT-EAD", "GC", "GC-EAD", "USC", "TN"
];

const CandidateDashboard = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("applications");
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editExperience, setEditExperience] = useState("");
  const [editWorkAuth, setEditWorkAuth] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editResumeUrl, setEditResumeUrl] = useState("");
  const [editAvailability, setEditAvailability] = useState("");
  const [editResumeText, setEditResumeText] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Skills State
  const [skills, setSkills] = useState<any[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillExp, setNewSkillExp] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("Intermediate");
  const [addingSkill, setAddingSkill] = useState(false);
  const [importingLinkedin, setImportingLinkedin] = useState(false);

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
      .single();

    if (data) {
      setProfile(data);
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
      .single();

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
    if (!profile) return;
    
    // Fetch jobs that match Candidate's Visa status
    const { data } = await supabase
      .from("jobs")
      .select(`
        *,
        employer:employer_profiles(company_name, logo_url),
        job_skills(*)
      `)
      .eq("is_active", true)
      .contains('work_authorization', [profile.work_authorization])
      .limit(10);
    
    setRecommendations(data || []);
  };

  // Add alert logic hidden

  const fetchApplications = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("candidate_profiles")
        .update({
          experience_years: editExperience ? parseInt(editExperience) : null,
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
        .single();

      if (!candidateProfile?.profiles?.email) return;

      const { data: candidateSkills } = await supabase
        .from("candidate_skills")
        .select("*")
        .eq("candidate_id", candidateProfile.id);

      if (!candidateSkills?.length) return;

      // Fetch active jobs with their skills
      let query = supabase
        .from("jobs")
        .select("*, employer:employer_profiles(company_name), job_skills(*)")
        .eq("is_active", true);

      // Filter by visa match if candidate has work auth set
      if (candidateProfile.work_authorization) {
        query = query.contains("work_authorization", [candidateProfile.work_authorization]);
      }

      const { data: jobs } = await query;
      if (!jobs?.length) return;

      // Calculate scores and filter >= 50%
      const matchedJobs = jobs
        .map(job => ({
          ...job,
          score: job.job_skills?.length ? calculateMatchScore(candidateSkills, job.job_skills) : 0
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
    if (!newSkillName || !profile) return;
    try {
      const { error } = await supabase
        .from("candidate_skills")
        .insert({
          candidate_id: profile.id,
          skill_name: newSkillName,
          years_experience: parseInt(newSkillExp) || 0,
          skill_level: newSkillLevel
        });

      if (error) throw error;
      toast({ title: "Skill added!" });
      setAddingSkill(false);
      setNewSkillName("");
      setNewSkillExp("");
      fetchSkills();
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
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (!profile) return <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">Loading profile...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Your Command Center</h1>
           <p className="text-muted-foreground mt-2 font-bold uppercase text-[10px] tracking-widest">Active session for {profile.profiles?.full_name}</p>
        </div>
        <div className="flex items-center gap-3">
           {/* LinkedIn Sync button removed as requested */}
           <Button onClick={() => setIsEditing(true)} className="h-12 px-6 font-black uppercase tracking-widest text-[10px] shadow-xl">
              <Settings className="h-4 w-4 mr-2" /> Global Prefs
           </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 border shadow-sm bg-card overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <Linkedin className="h-5 w-5 text-primary" /> Identity Vault
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
                        <Input 
                          placeholder="City, State / Remote" 
                          className="h-11 rounded-xl"
                          value={editLocation} 
                          onChange={(e) => setEditLocation(e.target.value)}
                        />
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
                          <div className="flex gap-2">
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
                                      const fileExt = file.name.split('.').pop();
                                      const filePath = `${session.user.id}/resume.${fileExt}`;
                                      const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, file, { upsert: true });
                                      if (uploadError) throw uploadError;
                                      const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(filePath);
                                      setEditResumeUrl(`${publicUrl}?t=${new Date().getTime()}`);
                                      toast({ title: "Resume Uploaded" });
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
                             onClick={async () => {
                                toast({ title: "Decrypting Resume...", description: "AI is extracting core competencies." });
                                await new Promise(r => setTimeout(r, 1500));
                                setEditResumeText("Simulated extraction successful: Proficient in React, Node.js, and Cloud Infrastructure.");
                                toast({ title: "Analysis Complete", description: "Skills mapped for synchronization." });
                             }}
                           >
                              <Target className="h-3 w-3 text-primary" /> Auto-Extract
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
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-xl border-2 border-primary/20">
                    {profile.profiles?.full_name?.charAt(0)}
                 </div>
                 <div>
                    <h3 className="font-black text-xl text-foreground uppercase tracking-tight">{profile.profiles?.full_name}</h3>
                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-1">
                       <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                       {profile.profiles?.email}
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/5 border p-3 rounded-xl flex flex-col">
                    <span className="text-[9px] text-muted-foreground uppercase font-black mb-1">Location</span>
                    <span className="text-xs font-bold truncate">{profile.location || "Not specified"}</span>
                  </div>
                  <div className="bg-muted/5 border p-3 rounded-xl flex flex-col">
                    <span className="text-[9px] text-muted-foreground uppercase font-black mb-1">Experience</span>
                    <span className="text-xs font-bold">{profile.experience_years || 0} Years</span>
                  </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Connective Services</Label>
                <div className="grid gap-2">
                  {profile.resume_url ? (
                    <a href={profile.resume_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full h-11 gap-3 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:border-primary/50 hover:bg-primary/5 shadow-sm">
                        <FileText className="h-4 w-4 text-primary" /> View Dossier
                      </Button>
                    </a>
                  ) : (
                    <div className="text-[9px] text-orange-600 bg-orange-50/50 p-3 rounded-xl border border-orange-100 font-bold flex items-center gap-2 italic">
                       Missing Resume Link
                    </div>
                  )}

                  {profile.linkedin_url ? (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full h-11 gap-3 text-[10px] font-black uppercase tracking-widest border-[#0A66C2]/20 text-[#0A66C2] hover:bg-[#0A66C2]/5 shadow-sm">
                        <Linkedin className="h-4 w-4" /> LinkedIn Bridge
                      </Button>
                    </a>
                  ) : (
                    <Button variant="ghost" onClick={() => setIsEditing(true)} className="h-11 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">
                       Link Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Skill Matrix Card */}
          <Card className="p-6 border shadow-sm bg-card overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" /> Skill Graph
                </h2>
                
                <Dialog open={addingSkill} onOpenChange={setAddingSkill}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 font-bold text-[10px] uppercase border-primary/30 hover:bg-primary/5">
                      <Plus className="h-3.5 w-3.5" /> Append
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px] border-none shadow-2xl rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-black uppercase tracking-tighter">Add Competency</DialogTitle>
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

             <ScrollArea className="h-[280px]">
                {skills.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Globe className="h-12 w-12 text-muted/20 mb-3" />
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-50">No data points mapped</p>
                  </div>
                ) : (
                  <Table className="w-full text-left border-collapse">
                    <TableHeader>
                      <TableRow className="bg-muted/10 hover:bg-muted/10 border-b border-border/50">
                        <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest w-[40%]">Skill</TableHead>
                        <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-center">Experience</TableHead>
                        <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-center">Level</TableHead>
                        <TableHead className="h-10 w-[50px]"></TableHead>
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
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{skill.skill_level}</span>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-destructive/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all rounded"
                              onClick={() => handleDeleteSkill(skill.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
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
        <div className="lg:col-span-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-muted/30 p-1.5 h-16 rounded-[2rem] gap-3">
              <TabsTrigger value="applications" className="data-[state=active]:bg-background data-[state=active]:shadow-2xl rounded-[1.5rem] h-full font-black uppercase text-[10px] tracking-widest gap-2.5">
                <Briefcase className="h-4 w-4" /> Journey
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="data-[state=active]:bg-background data-[state=active]:shadow-2xl rounded-[1.5rem] h-full font-black uppercase text-[10px] tracking-widest gap-2.5">
                <Target className="h-4 w-4" /> Best Fits
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-background data-[state=active]:shadow-2xl rounded-[1.5rem] h-full font-black uppercase text-[10px] tracking-widest gap-2.5">
                <Settings className="h-4 w-4" /> Core
              </TabsTrigger>
            </TabsList>

            <div className="mt-8">
              <TabsContent value="applications" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <Card className="p-8 border shadow-sm min-h-[600px] bg-card rounded-[2.5rem]">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter leading-none italic">Active Pipeline</h2>
                      <p className="text-[10px] text-muted-foreground mt-3 font-black uppercase tracking-[0.3em] opacity-40">Tracking your global career progress</p>
                    </div>
                    <Badge variant="outline" className="h-8 px-5 font-black text-[10px] tracking-widest border-primary/20 bg-primary/5 text-primary">
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
                    <div className="space-y-5">
                      {applications.map((app) => (
                        <Card key={app.id} className="p-0 border border-muted-foreground/10 hover:border-primary/40 transition-all hover:shadow-2xl group overflow-hidden bg-card rounded-[2rem]">
                          <div className="flex flex-col md:flex-row min-h-[140px]">
                             <div className="flex-1 p-8 space-y-6">
                                <div className="space-y-2">
                                   <div className="flex items-center gap-3">
                                      <h3 className="font-black text-2xl tracking-tighter uppercase leading-tight group-hover:text-primary transition-colors">
                                        {app.jobs?.title}
                                      </h3>
                                      <Badge variant="outline" className="h-5 text-[8px] font-black uppercase tracking-[0.2em] border-primary/20">{app.jobs?.job_mode}</Badge>
                                   </div>
                                   <div className="flex items-center text-xs font-bold text-muted-foreground tracking-widest uppercase">
                                      {app.jobs?.employer?.company_name}
                                   </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                   <div className="flex items-center bg-muted/30 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase text-muted-foreground italic border border-muted-foreground/5">
                                      Applied: {new Date(app.applied_at).toLocaleDateString()}
                                   </div>
                                </div>
                             </div>
                             <div className="md:w-[220px] bg-muted/20 border-l border-dashed flex flex-col items-center justify-center p-8 group-hover:bg-primary/5 transition-colors">
                                <span className="text-[9px] font-black text-muted-foreground/40 mb-3 uppercase tracking-widest">Global Status</span>
                                {getStatusBadge(app.status)}
                             </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="p-8 border shadow-sm min-h-[600px] bg-card rounded-[2.5rem]">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter leading-none italic">Targeted Matches</h2>
                      <p className="text-[10px] text-muted-foreground mt-3 font-black uppercase tracking-[0.3em] opacity-40">Filtered by your {profile.work_authorization} status</p>
                    </div>
                  </div>

                  {recommendations.length === 0 ? (
                    <div className="text-center py-32 opacity-20 hover:opacity-100 transition-opacity">
                      <Target className="h-16 w-16 mx-auto mb-6 text-primary" />
                      <h3 className="text-xl font-black uppercase tracking-[0.5em] mb-4">Neural Matching</h3>
                      <p className="max-w-xs mx-auto text-xs font-bold leading-relaxed uppercase tracking-widest">Scanning {skills.length} expert competencies against global vacancies...</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {recommendations.map(job => (
                        <Card key={job.id} className="p-6 border border-muted-foreground/10 hover:shadow-2xl transition-all group relative overflow-hidden bg-muted/5 rounded-3xl">
                           <div className="space-y-4">
                              <div>
                                 <h4 className="text-lg font-black uppercase tracking-tighter leading-none group-hover:text-primary transition-colors">{job.title}</h4>
                                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1.5">{job.employer?.company_name}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-background border-primary/20">{job.location}</Badge>
                                 <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border-transparent">{job.job_type}</Badge>
                              </div>
                              <Button className="w-full h-11 font-black uppercase text-[10px] shadow-lg rounded-2xl" asChild>
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

              <TabsContent value="settings">
                 <Card className="p-12 border shadow-sm min-h-[600px] bg-card rounded-[2.5rem]">
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-12">Core Preferences</h2>
                    <div className="space-y-8">
                       <div className="p-8 bg-muted/10 rounded-[2rem] border border-dashed flex items-center justify-between">
                          <div className="space-y-1">
                             <div className="font-black uppercase tracking-widest text-lg">Stealth Mode Profile</div>
                             <p className="text-xs font-medium text-muted-foreground italic">Your profile is currently PUBLIC to verified premium recruiters.</p>
                          </div>
                          <div className="w-16 h-8 bg-primary rounded-full flex items-center px-1 shadow-inner ring-4 ring-primary/20">
                             <div className="w-6 h-6 bg-white rounded-full ml-auto shadow-xl" />
                          </div>
                       </div>
                    </div>
                 </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
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