import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter 
} from "./ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Briefcase, Users, Check, X, FileText, MapPin, 
  DollarSign, Calendar, Trash2, Ban, Power, Mail 
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  HoverCard, HoverCardContent, HoverCardTrigger
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const WORK_AUTH_OPTIONS = [
  "H1B", "CPT-EAD", "OPT-EAD", "GC", "GC-EAD", "USC", "TN"
];

const EmployerDashboard = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);

  // Job Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [skills, setSkills] = useState("");
  const [experienceRequired, setExperienceRequired] = useState("");
  const [selectedWorkAuth, setSelectedWorkAuth] = useState<string[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchJobs();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("employer_profiles")
      .select("*, profiles(*)")
      .eq("user_id", session.user.id)
      .single();

    if (data) setProfile(data);
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
        .select("*")
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
          profiles(*)
        )
      `)
      .eq("job_id", jobId)
      .order('applied_at', { ascending: false });

    setApplications(data || []);
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const { error } = await supabase.from("jobs").insert({
      employer_id: profile.id,
      title,
      description,
      location,
      salary_min: salaryMin ? parseInt(salaryMin) : null,
      salary_max: salaryMax ? parseInt(salaryMax) : null,
      job_type: jobType,
      skills_required: skills.split(',').map(s => s.trim()).filter(Boolean),
      experience_required: experienceRequired ? parseInt(experienceRequired) : 0,
      work_authorization: selectedWorkAuth,
    });

    if (error) {
      console.error(error);
      toast({ title: "Error posting job", variant: "destructive" });
      return;
    }

    toast({ title: "Job posted successfully!" });
    setIsDialogOpen(false);
    fetchJobs();

    // Reset Form
    setTitle("");
    setDescription("");
    setLocation("");
    setSalaryMin("");
    setSalaryMax("");
    setSkills("");
    setExperienceRequired("");
    setSelectedWorkAuth([]);
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
        description: !currentStatus ? "Candidates can now apply." : "Candidates can no longer apply."
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
      toast({ title: "Delete failed", variant: "destructive" });
    } else {
      toast({ title: "Job deleted successfully" });
      fetchJobs();
    }
  };

  const updateApplicationStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", appId);

    if (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    } else {
      toast({ 
        title: `Application ${newStatus}`, 
        className: newStatus === 'accepted' ? "bg-green-50 border-green-200 text-green-800" : "" 
      });
      if (selectedJob) fetchApplications(selectedJob.id);
    }
  };

  const handleViewApplications = (job: any) => {
    setSelectedJob(job);
    fetchApplications(job.id);
  };

  const toggleWorkAuth = (auth: string) => {
    setSelectedWorkAuth(prev => 
      prev.includes(auth) ? prev.filter(a => a !== auth) : [...prev, auth]
    );
  };

  if (!profile) return <div className="p-8 flex justify-center text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your job postings and applicants</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="lg" 
            className="hidden sm:flex items-center gap-2 border-primary/20 hover:bg-primary/5 text-primary"
            onClick={() => window.location.href = 'mailto:support@opentoowork.com'}
          >
            <Mail className="h-5 w-5" /> Support
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-md bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Plus className="mr-2 h-5 w-5" /> Post New Job
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Post a New Opportunity</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePostJob} className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Title *</Label>
                  <Input required placeholder="e.g. Senior Software Engineer" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Location *</Label>
                  <Input required placeholder="e.g. Remote, New York, NY" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea required rows={6} placeholder="Describe the role, responsibilities, and requirements..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Job Type</Label>
                <ToggleGroup type="single" value={jobType} onValueChange={(val) => val && setJobType(val)} className="justify-start flex-wrap gap-2">
                  {["Full-time", "Part-time", "Contract", "Internship", "Hourly", "Monthly"].map(type => (
                    <ToggleGroupItem key={type} value={type} variant="outline" className="h-9 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      {type}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Experience (Years)</Label>
                  <Input type="number" min="0" placeholder="e.g. 3" value={experienceRequired} onChange={(e) => setExperienceRequired(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Salary Range (Optional)</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Min" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
                    <Input type="number" placeholder="Max" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Required Skills (comma separated)</Label>
                <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, TypeScript, AWS" />
              </div>

              <div className="space-y-3">
                <Label>Accepted Work Authorization *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-lg bg-muted/20">
                  {WORK_AUTH_OPTIONS.map((auth) => (
                    <div key={auth} className="flex items-center space-x-2">
                      <Checkbox 
                        id={auth} 
                        checked={selectedWorkAuth.includes(auth)}
                        onCheckedChange={() => toggleWorkAuth(auth)}
                      />
                      <label htmlFor={auth} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        {auth}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-base bg-primary hover:bg-primary/90">
                Publish Job Post
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Jobs Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" /> Active Listings
        </h2>

        {jobs.length === 0 ? (
          <Card className="p-12 text-center border-dashed bg-muted/10">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No active job postings</h3>
            <p className="text-muted-foreground mt-1">Post your first job to start finding talent.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {jobs.map(job => (
              <Card key={job.id} className={`p-6 transition-all hover:shadow-md border-l-4 ${job.is_active ? 'border-l-primary' : 'border-l-muted-foreground/30 bg-muted/5'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Job Info */}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className={`text-xl font-bold ${job.is_active ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {job.title}
                      </h3>
                      {!job.is_active && (
                        <Badge variant="secondary" className="text-xs bg-muted-foreground/10 text-muted-foreground">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {job.location}</span>
                      <span className="flex items-center"><Briefcase className="h-3 w-3 mr-1" /> {job.job_type}</span>
                      {(job.salary_min || job.salary_max) && (
                        <span className="flex items-center text-success"><DollarSign className="h-3 w-3 mr-1" /> ${job.salary_min?.toLocaleString()} - {job.salary_max?.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {/* View Applicants */}
                    <Button 
                      onClick={() => handleViewApplications(job)} 
                      variant="outline"
                      className="bg-background"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Applicants
                    </Button>

                    <div className="h-6 w-px bg-border mx-1 hidden md:block"></div>

                    {/* Toggle Active */}
                    <Button
                      variant="ghost"
                      size="icon"
                      title={job.is_active ? "Deactivate Job" : "Activate Job"}
                      onClick={() => handleToggleActive(job.id, job.is_active)}
                      className={job.is_active ? "text-orange-500 hover:text-orange-600 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                    >
                      {job.is_active ? <Ban className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>

                    {/* Delete Job */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Job Posting?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the job "{job.title}" and all associated applications.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDeleteJob(job.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Applications Dialog */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-7xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 border-b bg-muted/10">
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Applicants for <span className="text-primary">{selectedJob.title}</span></span>
                </div>
                <Badge variant="outline" className="text-sm font-normal bg-background">
                  {applications.length} Total
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden bg-background">
              {applications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium">No applicants yet</h3>
                  <p className="text-muted-foreground">Candidates who apply will appear here.</p>
                </div>
              ) : (
                <ScrollArea className="h-full w-full">
                  <Table>
                    <TableHeader className="bg-muted/5 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="w-[200px]">Candidate</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Cover Letter</TableHead>
                        <TableHead>Resume</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id} className="hover:bg-muted/5">
                          <TableCell className="align-top">
                            <div className="font-medium text-foreground">{app.candidate?.profiles?.full_name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{app.candidate?.profiles?.email}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">Applied: {new Date(app.applied_at).toLocaleDateString()}</div>
                          </TableCell>
                          
                          <TableCell className="align-top">
                            <div className="flex flex-col gap-1.5">
                              <Badge variant="outline" className="w-fit text-[10px] h-5 border-blue-200 text-blue-700 bg-blue-50">
                                {app.candidate?.work_authorization}
                              </Badge>
                              <span className="text-xs font-medium text-foreground/80">
                                {app.candidate?.experience_years ? `${app.candidate.experience_years} Years Exp.` : "No Exp. listed"}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="align-top">
                            {app.cover_letter ? (
                              <div className="flex items-center">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <div className="cursor-pointer group flex items-center">
                                       <HoverCard>
                                          <HoverCardTrigger asChild>
                                            <div className="flex items-center gap-1.5 py-1 px-2 rounded-md bg-muted/30 hover:bg-muted/60 transition-colors border border-transparent hover:border-border/50">
                                              <FileText className="h-3.5 w-3.5 text-primary" />
                                              <span className="text-xs font-medium text-foreground/80 truncate max-w-[80px]">
                                                View Note
                                              </span>
                                            </div>
                                          </HoverCardTrigger>
                                          <HoverCardContent side="right" align="start" className="w-[400px] p-0 shadow-xl z-[50]">
                                            <div className="bg-muted/10 px-4 py-3 border-b">
                                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" /> Candidate Note
                                              </h4>
                                            </div>
                                            <ScrollArea className="h-[250px] w-full bg-background">
                                              <div className="p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                                {app.cover_letter}
                                              </div>
                                            </ScrollArea>
                                          </HoverCardContent>
                                       </HoverCard>
                                    </div>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl z-[100]">
                                    <DialogHeader>
                                      <DialogTitle>Cover Letter</DialogTitle>
                                      <DialogDescription>
                                        Applicant: {app.candidate?.profiles?.full_name}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <ScrollArea className="max-h-[60vh] mt-2 border rounded-md p-6 bg-muted/5">
                                      <p className="text-sm leading-7 whitespace-pre-wrap text-foreground/90">
                                        {app.cover_letter}
                                      </p>
                                    </ScrollArea>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic opacity-70">None</span>
                            )}
                          </TableCell>

                          <TableCell className="align-top">
                            {app.candidate?.resume_url ? (
                              <a 
                                href={app.candidate.resume_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline bg-primary/5 px-2.5 py-1.5 rounded-sm border border-primary/10 transition-colors hover:bg-primary/10"
                              >
                                <FileText className="w-3.5 h-3.5" /> Resume
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground italic opacity-70">Missing</span>
                            )}
                          </TableCell>

                          <TableCell className="align-top">
                            <Badge 
                              className="capitalize font-medium shadow-none" 
                              variant={app.status === 'accepted' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}
                            >
                              {app.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right align-top">
                            <div className="flex justify-end gap-1">
                              {app.status === 'pending' ? (
                                <>
                                  <Button 
                                    size="icon" 
                                    className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white shadow-sm rounded-full"
                                    onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                    title="Approve"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="outline"
                                    className="h-8 w-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-full"
                                    onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                    title="Reject"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 text-xs text-muted-foreground hover:bg-muted"
                                  onClick={() => updateApplicationStatus(app.id, 'pending')}
                                >
                                  Reset Status
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EmployerDashboard;