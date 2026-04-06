import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Building2, DollarSign, Briefcase, Calendar, Lock, CheckCircle2, Globe, Target, Share2, Users } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";
import { sendApplicationConfirmation, sendEmployerNewApplicantAlert, calculateMatchScore, sendReferralEmail } from "@/lib/email";
import { formatLocation } from "@/lib/utils";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [hasApplied, setHasApplied] = useState(false);
  
  // User state
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [candidateSkills, setCandidateSkills] = useState<any[]>([]);

  // Referral states
  const [referralEmail, setReferralEmail] = useState("");
  const [referralNote, setReferralNote] = useState("");
  const [isReferring, setIsReferring] = useState(false);
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);

  useEffect(() => {
    fetchJob();
    checkUser();
  }, [id]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      
      // Fetch role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUserRole(profile.role);
        
        // If candidate, fetch candidate profile and check application status
        if (profile.role === "candidate") {
          const { data: candidateData } = await supabase
            .from("candidate_profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single();
          
          setCandidateProfile(candidateData);

          if (candidateData && id) {
            checkApplicationStatus(candidateData.id, id);
            fetchCandidateSkills(candidateData.id);
          }
        }
      }
    }
  };

  const fetchCandidateSkills = async (candidateId: string) => {
    const { data } = await supabase
      .from("candidate_skills")
      .select("*")
      .eq("candidate_id", candidateId);
    setCandidateSkills(data || []);
  };

  const checkApplicationStatus = async (candidateId: string, jobId: string) => {
    const { data } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("candidate_id", candidateId)
      .maybeSingle();
    
    if (data) {
      setHasApplied(true);
    }
  };

  const trackView = async (jobId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from("job_views").insert({
        job_id: jobId,
        viewer_id: session?.user?.id || null
      });
    } catch {}
  };

  const fetchJob = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        employer:employer_profiles(
          user_id,
          company_name,
          company_website,
          location,
          description,
          logo_url
        ),
        job_skills(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching job:", error);
      toast({
        title: "Error",
        description: "Could not load job details",
        variant: "destructive",
      });
    } else {
      setJob(data);
      if (data?.id) trackView(data.id);
    }
    setLoading(false);
  };

  const getMatchScore = () => {
    if (!job || !candidateProfile) return 0;
    return calculateMatchScore(candidateProfile.candidate_skills || [], job.job_skills || [], candidateProfile.desired_job_title, job.title);
  };

  const matchScore = getMatchScore();
  const isJobExpired = job?.expires_at && new Date(job.expires_at) < new Date();

  const handleApply = async () => {
    if (!user) {
      navigate("/onboard", { state: { returnTo: `/jobs/${job.id}` } });
      return;
    }

    if (userRole === "admin") {
      toast({
        title: "Administrator Notice",
        description: "Admins cannot apply for jobs. Please use a candidate account.",
        variant: "destructive",
      });
      return;
    }

    if (userRole === "employer") {
      // Re-route to referral/representation dialog
      setIsReferralDialogOpen(true);
      return;
    }

    // CHECK FOR RESUME
    if (!candidateProfile.resume_url) {
      toast({
        title: "Resume Link Required",
        description: "Please add a resume link (Google Drive, Dropbox, etc.) to your profile before applying.",
        variant: "destructive",
        action: (
          <ToastAction altText="Go to Dashboard" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </ToastAction>
        ),
      });
      return;
    }

    setIsApplying(true);
    try {
      const { error } = await supabase.from("applications").insert({
        job_id: job.id,
        candidate_id: candidateProfile.id,
        cover_letter: coverLetter,
      });

      if (error) {
        if (error.code === '23505') {
          setHasApplied(true);
          throw new Error("You have already applied to this job.");
        }
        throw error;
      }

      toast({
        title: "Application submitted!",
        description: "Good luck with your application!",
      });
      setHasApplied(true);
      setCoverLetter("");

      // ── Send email notifications (fire & forget) ──
      const candidateName = candidateProfile?.profiles?.full_name || user?.user_metadata?.full_name || 'Candidate';
      const candidateEmail = user?.email;
      const employerEmail = job.employer?.profiles?.email;

      if (candidateEmail) {
        sendApplicationConfirmation(
          candidateEmail,
          candidateName,
          job.title,
          job.employer?.company_name || 'Company'
        );
      }

      // Fetch employer email for the alert
      const { data: employerUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', job.employer?.user_id)
        .single();

      if (employerUser?.email) {
        sendEmployerNewApplicantAlert(
          employerUser.email,
          candidateName,
          job.title
        );
      }
    } catch (error: any) {
      toast({
        title: "Info",
        description: error.message,
        variant: error.code === '23505' ? "default" : "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleReferral = async () => {
    if (!referralEmail) {
      toast({ title: "Email required", description: "Please enter the candidate's email address.", variant: "destructive" });
      return;
    }

    setIsReferring(true);
    try {
      // 1. Save to DB with extra fields if provided
      const { error } = await supabase.from("referrals").insert({
        job_id: job.id,
        referrer_id: user?.id || null,
        referred_email: referralEmail,
        candidate_name: referralName,
        resume_url: referralResume,
        cover_letter: referralNote
      });

      if (error) throw error;

      // 2. Send Email
      await sendReferralEmail(
        referralEmail,
        user?.user_metadata?.full_name || user?.email || "Someone",
        job.title,
        job.employer?.company_name || "a Company",
        job.id
      );

      toast({ 
        title: userRole === 'employer' ? "Candidate Submitted!" : "Referral Sent!", 
        description: `We've notified ${referralEmail} and added them to the job's pipeline.` 
      });
      
      // Reset
      setReferralEmail("");
      setReferralName("");
      setReferralResume("");
      setReferralNote("");
      setIsReferralDialogOpen(false);
    } catch (error: any) {
      console.error("Error sending referral:", error);
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } finally {
      setIsReferring(false);
    }
  };

  const [referralName, setReferralName] = useState("");
  const [referralResume, setReferralResume] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Job not found</p>
        </div>
      </div>
    );
  }

  const isRestrictedUser = userRole === 'admin' || userRole === 'employer';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary-light/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 shadow-xl border-border/50">
            <div className="space-y-6">
              <div className="pb-6 border-b border-border/50">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent italic">
                  {job.title}
                </h1>
                <div className="flex flex-wrap gap-4 text-muted-foreground mb-4">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {job.employer?.company_name}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {formatLocation(job.location)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    {job.job_type}
                  </span>
                  {job.job_mode && (
                    <span className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {job.job_mode}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </span>
                  {job.expires_at && (
                    <span className="flex items-center gap-2 text-orange-600">
                      <Calendar className="h-5 w-5" />
                      Expires {new Date(job.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                 {matchScore > 0 && !isJobExpired && (
                   <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Target className="h-6 w-6 text-primary" />
                         </div>
                         <div>
                            <div className="text-sm font-black uppercase tracking-widest text-primary">Your Match Score</div>
                            <div className="text-xs text-muted-foreground font-medium">Based on your expertise and job requirements</div>
                         </div>
                      </div>
                      <div className="text-3xl font-black text-primary tabular-nums">
                         {matchScore}%
                      </div>
                   </div>
                )}

                {isJobExpired && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4 text-red-600 animate-pulse">
                    <CheckCircle2 className="h-6 w-6 shrink-0 rotate-45" />
                    <div>
                      <div className="font-black uppercase tracking-tighter text-sm">Opportunity Expired</div>
                      <div className="text-xs opacity-80 font-medium">This listing has reached its application deadline and is no longer active.</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 h-12 gap-2 font-black uppercase tracking-widest text-[10px] border-primary/20 hover:bg-primary/5">
                        <Share2 className="h-4 w-4" /> Share Job
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="uppercase font-black italic tracking-tighter">Share Opportunity</DialogTitle>
                        <DialogDescription className="sr-only">Copy the job link to share this opportunity with your professional network.</DialogDescription>
                      </DialogHeader>
                      <div className="flex items-center space-x-2 py-4">
                        <div className="grid flex-1 gap-2">
                          <Label htmlFor="link" className="sr-only">Link</Label>
                          <Input
                            id="link"
                            defaultValue={window.location.href}
                            readOnly
                            className="h-11 font-mono text-[10px]"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          size="sm" 
                          className="px-6 h-11 font-black uppercase text-[10px]"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast({ title: "Link Copied!", description: "Share it with your network." });
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* <Dialog open={isReferralDialogOpen} onOpenChange={setIsReferralDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 h-12 gap-2 font-black uppercase tracking-widest text-[10px] border-primary/20 hover:bg-primary/5">
                        <Users className="h-4 w-4" /> {userRole === 'employer' ? "Submit Candidate" : "Refer Talent"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle className="uppercase font-black italic tracking-tighter">
                          {userRole === 'employer' ? "Represent Candidate" : "Refer a Candidate"}
                        </DialogTitle>
                        <DialogDescription className="text-[10px] uppercase font-bold tracking-widest opacity-70">
                          {userRole === 'employer' ? "Submit your candidate profile into the hiring partner's pipeline" : "Help someone in your network find their next career move"}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest">Candidate Full Name</Label>
                            <Input 
                              placeholder="John Doe" 
                              className="h-11 rounded-xl"
                              value={referralName}
                              onChange={(e) => setReferralName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest">Candidate Email</Label>
                            <Input 
                              type="email"
                              placeholder="candidate@example.com" 
                              className="h-11 rounded-xl"
                              value={referralEmail}
                              onChange={(e) => setReferralEmail(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black tracking-widest">Resume Link (GDrive/Dropbox/URL)</Label>
                          <Input 
                            placeholder="https://..." 
                            className="h-11 rounded-xl"
                            value={referralResume}
                            onChange={(e) => setReferralResume(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black tracking-widest">Additional Notes / Cover Letter</Label>
                          <Textarea 
                            placeholder="Briefly explain their expertise or your relationship to them..." 
                            className="rounded-xl min-h-[100px]" 
                            value={referralNote}
                            onChange={(e) => setReferralNote(e.target.value)}
                          />
                        </div>
                        <Button 
                          className="w-full h-12 font-black uppercase text-[10px] shadow-xl bg-gradient-to-r from-primary to-accent" 
                          onClick={handleReferral}
                          disabled={isReferring || isJobExpired}
                        >
                          {isReferring ? "Processing..." : isJobExpired ? "Listing Expired" : userRole === 'employer' ? "Submit Representation" : "Submit Referral"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog> */}
              </div>

              {(job.salary_min || job.salary_max) && (
                <div className="flex items-center gap-3 text-lg font-semibold text-success bg-success/10 rounded-xl p-4">
                  <DollarSign className="h-6 w-6" />
                  ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()} <span className="text-sm opacity-70 ml-1">/ {
                    job.salary_period === 'Hourly' ? 'hour' : 
                    job.salary_period === 'Monthly' ? 'month' : 
                    'year'
                  }</span>
                </div>
              )}

              {/* Job Skills from new table */}
              {job.job_skills && job.job_skills.length > 0 && (
                <div>
                  <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Required Skills
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {job.job_skills.map((skill: any) => (
                      <Badge key={skill.id} variant={skill.is_required ? "default" : "secondary"} className={skill.is_required ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"}>
                        {skill.skill_name} ({skill.years_experience}y) {skill.is_required ? "" : "· Optional"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy skills_required array */}
              {(!job.job_skills || job.job_skills.length === 0) && job.skills_required && job.skills_required.length > 0 && (
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Required Skills
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {job.skills_required.map((skill: string) => (
                      <Badge key={skill} className="bg-primary/10 text-primary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-base font-semibold mb-2 block">
                  Job Description
                </Label>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>

              {job.employer?.description && (
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    About {job.employer.company_name}
                  </Label>
                  <p className="text-muted-foreground">
                    {job.employer.description}
                  </p>
                </div>
              )}

              {/* === ACTION AREA === */}
              
              {userRole === 'admin' ? (
                // 1. Restricted View for Admin
                <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-xl border border-border border-dashed">
                  <Lock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-lg font-semibold text-foreground">
                    Administrator View
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Job applications are disabled for admin accounts.
                  </p>
                </div>
              ) : userRole === 'employer' ? (
                 // 1b. Support for Employers submitting candidates
                 {/* <div className="w-full space-y-3">
                   <Button 
                     size="lg" 
                     className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg text-lg h-14 font-black uppercase tracking-widest"
                     onClick={() => setIsReferralDialogOpen(true)}
                   >
                     Submit Your Candidate
                   </Button>
                   <p className="text-[9px] text-center text-muted-foreground font-black uppercase tracking-widest">
                     As an employer/representative, you can submit talent profiles directly to this hiring partner
                   </p>
                 </div> */}
              ) : hasApplied ? (
                // 2. Already Applied State
                <div className="w-full">
                  <Button size="lg" disabled className="w-full bg-success/80 hover:bg-success/80 text-white h-14 text-lg">
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Applied
                  </Button>
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    You submitted your application on {new Date().toLocaleDateString()}
                  </p>
                </div>
              ) : (
                // 3. Apply Button (Candidates Only)
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                        size="lg" 
                        disabled={isJobExpired}
                        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg text-lg h-14 font-black uppercase tracking-widest"
                     >
                       {isJobExpired ? "Opportunity Closed" : "Apply Now"}
                     </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Apply for {job.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="coverletter">Cover Letter (Optional)</Label>
                        <Textarea
                          id="coverletter"
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          rows={6}
                          placeholder="Tell the employer why you're a great fit..."
                        />
                      </div>
                      <Button 
                        onClick={handleApply} 
                        disabled={isApplying}
                        className="w-full h-12 font-black uppercase text-[10px]"
                      >
                        {isApplying ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;