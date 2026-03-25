import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, ExternalLink, Loader2, Briefcase, MapPin, Globe, Users, Calendar, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const JobsTab = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        employer:employer_profiles(company_name),
        application_count:applications(count)
      `)
      .order("created_at", { ascending: false });

    if (error) {
       toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
       setJobs(data || []);
    }
    setLoading(false);
  };

  const toggleJobStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("jobs")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchJobs();
      toast({ title: `Listing ${!currentStatus ? 'Activated' : 'Deactivated'}` });
    }
  };

  const deleteJob = async (id: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job listing purged" });
      fetchJobs();
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] px-6 py-5 text-muted-foreground">Listing Identity</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground">Corporate Source</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground">Metrics</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground">Governance</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground">Approval</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] px-6 py-5 text-muted-foreground">Protocol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Auditing Inventory...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Briefcase className="h-8 w-8 opacity-20" />
                      <span className="text-sm font-bold opacity-40">Zero listings found in registry.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id} className="group border-border/40 hover:bg-muted/10 transition-colors">
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm tracking-tight truncate uppercase leading-none">{job.title}</span>
                          {job.is_featured && <Badge className="h-4 px-1.5 text-[8px] font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-600 border-none shadow-sm shadow-amber-500/20">Featured</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          <span className="text-primary/70">{job.job_id || 'ID-PENDING'}</span>
                          <Separator orientation="vertical" className="h-2.5" />
                          <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {job.location}</span>
                          {job.job_mode && <><Separator orientation="vertical" className="h-2.5" /><span className="flex items-center gap-1"><Globe className="h-2.5 w-2.5" /> {job.job_mode}</span></>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs uppercase tracking-tight">{job.employer?.company_name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5"><Calendar className="h-2.5 w-2.5" /> {new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center px-3 py-1 bg-muted/30 rounded-lg border border-border/40">
                            <span className="text-sm font-black tabular-nums">{job.application_count?.[0]?.count || 0}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Flows</span>
                        </div>
                        {job.expires_at && new Date(job.expires_at) < new Date() && (
                            <div className="flex items-center gap-1.5 text-destructive animate-pulse">
                              <AlertCircle className="h-3 w-3" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Expired</span>
                            </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={job.is_active} 
                          onCheckedChange={async () => {
                            const { error } = await supabase.from("jobs").update({ is_active: !job.is_active }).eq("id", job.id);
                            if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                            else { fetchJobs(); toast({ title: "Listing Status Updated" }); }
                          }}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <Badge variant={job.is_active ? "outline" : "destructive"} className="text-[9px] font-black uppercase tracking-widest">
                          {job.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6 py-5">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Link to={`/jobs/${job.id}`}>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl"
                          onClick={() => deleteJob(job.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default JobsTab;