import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, Loader2, User, Shield, Briefcase, Mail, Phone, Calendar, MapPin, ExternalLink, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

const UsersTab = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const fetchUserDetails = async (user: any) => {
    setSelectedUser(user);
    setDetailsLoading(true);
    
    let table = user.role === 'employer' ? 'employer_profiles' : 'candidate_profiles';
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching details:", error);
    }
    setUserDetails(data);
    setDetailsLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    // Note: This ideally uses a service role or edge function. 
    // Here we attempt a public profile delete which requires RLS permissions.
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    
    if (error) {
      toast({ title: "Error", description: "Could not delete user. Check permissions.", variant: "destructive" });
    } else {
      toast({ title: "User purged from registry" });
      fetchUsers();
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesName = (user.full_name?.toLowerCase().includes(nameFilter.toLowerCase()) || 
                        user.email?.toLowerCase().includes(nameFilter.toLowerCase()));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesName && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Query entity by name or digital address..." 
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="pl-10 h-11 bg-muted/20 border-border/40 focus:ring-primary/20" 
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[200px] h-11 font-bold text-xs uppercase tracking-widest bg-muted/20 border-border/40">
            <SelectValue placeholder="Access Tier" />
          </SelectTrigger>
          <SelectContent className="border-none shadow-2xl rounded-xl">
            <SelectItem value="all" className="font-bold text-xs uppercase tracking-widest">Global Scan</SelectItem>
            <SelectItem value="candidate" className="font-bold text-xs uppercase tracking-widest">Candidates</SelectItem>
            <SelectItem value="employer" className="font-bold text-xs uppercase tracking-widest">Employers</SelectItem>
            <SelectItem value="admin" className="font-bold text-xs uppercase tracking-widest">Administrators</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] px-6 py-5 text-muted-foreground">Entity Identity</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground">Access Layer</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground">Registration</TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] px-6 py-5 text-muted-foreground">Governance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-24">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Synchronizing Registry...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-24 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 opacity-20" />
                    <span className="text-sm font-bold opacity-40">No entities found in this sector.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="group border-border/40 hover:bg-muted/10 transition-colors">
                  <TableCell className="px-6 py-5">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center font-black text-primary text-xs tracking-tighter shrink-0 shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                           {user.full_name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                           <span className="font-black text-sm tracking-tight truncate uppercase">{user.full_name}</span>
                           <span className="text-[11px] text-muted-foreground font-medium truncate">{user.email}</span>
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="py-5">
                     <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 border-transparent shadow-sm">
                        {user.role}
                     </Badge>
                  </TableCell>
                  <TableCell className="py-5 font-bold text-[11px] text-muted-foreground tabular-nums tracking-tight">
                     {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right px-6 py-5 text-muted-foreground tabular-nums">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Dialog>
                         <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl" onClick={() => fetchUserDetails(user)}>
                               <ExternalLink className="h-4 w-4" />
                            </Button>
                         </DialogTrigger>
                         <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-card animate-in zoom-in-95 duration-300">
                            <DialogHeader className="p-8 pb-4 bg-primary/5 border-b border-primary/10">
                               <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter">
                                  <User className="h-6 w-6 text-primary outline outline-4 outline-primary/10 rounded-full" />
                                  Profile Insight
                               </DialogTitle>
                               <DialogDescription className="sr-only">
                                 View detailed information about this user including their role, contact details, and professional profile.
                               </DialogDescription>
                            </DialogHeader>
                            {detailsLoading ? (
                               <div className="p-20 text-center flex flex-col items-center gap-4">
                                  <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accessing Extended Records...</span>
                               </div>
                            ) : selectedUser && (
                               <div className="p-8 space-y-8">
                                  <div className="flex justify-between items-start">
                                     <div className="space-y-2">
                                        <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{selectedUser.full_name}</h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">
                                           <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {selectedUser.email}</div>
                                           {selectedUser.phone && <><Separator orientation="vertical" className="h-3 bg-border/40" /><div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {selectedUser.phone}</div></>}
                                        </div>
                                     </div>
                                     <Badge variant={selectedUser.role === 'admin' ? 'destructive' : 'default'} className="uppercase tracking-widest text-[9px] font-black px-4 py-1.5 shadow-lg shadow-primary/20">
                                        {selectedUser.role}
                                     </Badge>
                                  </div>

                                  <Separator className="bg-border/40" />

                                  {userDetails ? (
                                     <div className="grid grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                           {selectedUser.role === 'employer' ? (
                                              <>
                                                 <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Corporation</Label>
                                                    <div className="text-sm font-black flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border/40"><Briefcase className="h-4 w-4 text-primary" /> {userDetails.company_name}</div>
                                                 </div>
                                                 <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">HQ Location</Label>
                                                    <div className="text-sm font-bold flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border/40"><MapPin className="h-4 w-4 text-primary" /> {userDetails.location}</div>
                                                 </div>
                                              </>
                                           ) : (
                                              <>
                                                 <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Biographic Index</Label>
                                                    <div className="text-xs font-medium leading-relaxed italic border-l-4 border-primary/30 pl-4 py-2 bg-primary/5 rounded-r-xl">"{userDetails.bio || 'Detailed biographic index not initialized.'}"</div>
                                                 </div>
                                                 <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Work Authorization</Label>
                                                    <div className="text-xs font-black uppercase bg-blue-600/5 text-blue-600 px-3 py-1.5 rounded-lg w-fit border border-blue-200/50 flex items-center gap-2 shadow-sm">
                                                       <Shield className="h-3.5 w-3.5" /> {userDetails.work_authorization}
                                                    </div>
                                                 </div>
                                              </>
                                           )}
                                        </div>
                                        <div className="space-y-6">
                                           <div className="space-y-2">
                                              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Registration Date</Label>
                                              <div className="text-sm font-bold flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border/40"><Calendar className="h-4 w-4 text-primary" /> {new Date(selectedUser.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                                           </div>
                                           {selectedUser.role === 'candidate' && (
                                              <div className="space-y-3">
                                                 <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Asset Repository</Label>
                                                 <div className="flex flex-col gap-2">
                                                    {userDetails.resume_url ? (
                                                       <Button variant="default" size="sm" className="h-10 text-[10px] font-black uppercase tracking-widest gap-3 w-full shadow-lg shadow-primary/20" onClick={() => window.open(userDetails.resume_url, '_blank')}>
                                                          <FileText className="h-4 w-4" /> Inspect Core Assets
                                                       </Button>
                                                    ) : <div className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/40 bg-muted/20 p-3 rounded-xl border border-dashed text-center">No Assets Deployed</div>}
                                                    {userDetails.linkedin_url && (
                                                      <Button variant="outline" size="sm" className="h-10 text-[10px] font-black uppercase tracking-widest gap-3 w-full border-muted-foreground/20" onClick={() => window.open(userDetails.linkedin_url, '_blank')}>
                                                         External Connection
                                                      </Button>
                                                    )}
                                                 </div>
                                              </div>
                                           )}
                                        </div>
                                     </div>
                                  ) : (
                                     <div className="py-16 text-center bg-muted/20 rounded-3xl border border-dashed border-muted text-muted-foreground/40 text-sm font-black uppercase tracking-widest">
                                        Incomplete profile record detected
                                     </div>
                                  )}
                               </div>
                            )}
                         </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10 animate-in fade-in-0 slide-in-from-bottom-5 duration-500">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-3xl font-black uppercase tracking-tighter text-destructive">Decommission Entity?</AlertDialogTitle>
                            <AlertDialogDescription className="text-base font-semibold text-muted-foreground/80 leading-relaxed pt-2">
                              This protocol is strictly irreversible. All security credentials, profile metadata, and associated data streams will be permanently purged from the registry.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-10 gap-4">
                            <AlertDialogCancel className="rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] border-muted-foreground/20 px-8 h-12">Abort Deletion</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="rounded-2xl bg-destructive hover:bg-destructive/90 font-black uppercase tracking-[0.2em] text-[10px] px-10 h-12 shadow-2xl shadow-destructive/40">
                              Purge Registry
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

export default UsersTab;