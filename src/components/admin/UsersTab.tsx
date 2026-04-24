import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, Loader2, User, Shield, Briefcase, Mail, Phone, Calendar, MapPin, ExternalLink, FileText, Download } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type CandidateProfileRow = Database["public"]["Tables"]["candidate_profiles"]["Row"] & {
  certifications?: string[];
};
type EmployerProfileRow = Database["public"]["Tables"]["employer_profiles"]["Row"];
type AdminUserDetails = {
  full_name?: string | null;
  email?: string | null;
  location?: string | null;
  desired_job_title?: string | null;
  job_title?: string | null;
  recruiter_job_title?: string | null;
  phone?: string | null;
  work_authorization?: string | null;
  visa_type?: string | null;
  linkedin_url?: string | null;
  certifications?: string[];
};
type AdminUserRow = ProfileRow & { details: AdminUserDetails };

const FilterHeader = ({ label, filterValue, setFilterValue }: { label: string, filterValue: string, setFilterValue: (val: string) => void }) => (
  <div className="flex items-center gap-2">
    <span>{label}</span>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`h-6 w-6 rounded-md ${filterValue ? 'text-primary bg-primary/10' : 'text-muted-foreground/50 hover:text-muted-foreground'}`}>
          <Filter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 shadow-xl rounded-xl z-50" align="start">
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filter by {label}</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              autoFocus
              className="pl-8 h-8 text-xs bg-muted/20 border-border/40 focus:ring-primary/20"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </div>
          {filterValue && (
             <Button variant="ghost" size="sm" onClick={() => setFilterValue('')} className="h-7 w-full text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground">Clear Filter</Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  </div>
);

const UsersTab = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Sheet-style column filters
  const [filterTitle, setFilterTitle] = useState("");
  const [filterContact, setFilterContact] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterVisa, setFilterVisa] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, candidatesRes, employersRes, certificationsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("candidate_profiles").select("*"),
        supabase.from("employer_profiles").select("*"),
        supabase.from("candidate_certifications").select("*")
      ]);

      if (profilesRes.error) throw profilesRes.error;
      
      const certsByCandidateId = (certificationsRes.data || []).reduce<Record<string, string[]>>((acc, cert) => {
        if (!acc[cert.candidate_id]) acc[cert.candidate_id] = [];
        acc[cert.candidate_id].push(cert.certification_name);
        return acc;
      }, {});

      const candidatesMap = (candidatesRes.data || []).reduce<Record<string, CandidateProfileRow>>((acc, candidate) => {
        acc[candidate.user_id] = { ...candidate, certifications: certsByCandidateId[candidate.id] || [] };
        return acc;
      }, {});
      const employersMap = (employersRes.data || []).reduce<Record<string, EmployerProfileRow>>((acc, employer) => {
        acc[employer.user_id] = employer;
        return acc;
      }, {});

      const merged = (profilesRes.data || []).map((profile) => {
        let details: AdminUserDetails = {};
        if (profile.role === 'candidate') details = candidatesMap[profile.id] || {};
        if (profile.role === 'employer') details = employersMap[profile.id] || {};
        return { ...profile, details };
      }) as AdminUserRow[];
      
      setUsers(merged);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch users";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const splitLocation = (value?: string | null) => {
    if (!value) return { city: "-", state: "-" };
    const parts = value.split(",").map((part) => part.trim());
    return {
      city: parts[0] || "-",
      state: parts.length > 1 ? parts[1] : "-",
    };
  };

  const normalizeText = (value?: string | null) => value?.trim().toLowerCase() || "";

  const getDisplayName = (user: AdminUserRow) => {
    const profileName = user.full_name?.trim() || "";
    const detailName = user.details?.full_name?.trim() || "";
    const emailPrefix = user.email?.trim()?.split("@")[0] || "";

    return profileName || detailName || emailPrefix || `${user.role || "user"} profile`;
  };

  const getDisplayEmail = (user: AdminUserRow) => user.email?.trim() || user.details?.email?.trim() || "No email";

  const filteredUsers = users.filter((user) => {
    const searchTerm = normalizeText(nameFilter);
    const displayName = getDisplayName(user);
    const displayEmail = getDisplayEmail(user);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    // Advanced column filters
    const userLocationParts = splitLocation(user.details?.location);
    const userLocationStr = `${userLocationParts.city}, ${userLocationParts.state}`.toLowerCase();
    
    // Title/Role extraction mapping what is displayed
    const userTitle = (user.role === 'candidate' ? user.details?.desired_job_title : (user.details?.job_title || user.details?.recruiter_job_title)) || '';
    const userVisa = user.details?.work_authorization || user.details?.visa_type || '';
    const userContactInfo = user.details?.phone || user.phone || '';
    const userLinkedIn = user.details?.linkedin_url || '';
    const userCertifications = (user.details?.certifications || []).join(' ');

    const matchesName = !searchTerm || [displayName, displayEmail, userTitle, userContactInfo, userLocationStr, userVisa, userLinkedIn, userCertifications]
      .some((value) => normalizeText(value).includes(searchTerm));
    const matchesTitle = normalizeText(userTitle).includes(normalizeText(filterTitle));
    const matchesContact = normalizeText(userContactInfo).includes(normalizeText(filterContact));
    const matchesLoc = userLocationStr.includes(normalizeText(filterLocation));
    const matchesVisa = normalizeText(userVisa).includes(normalizeText(filterVisa));

    return matchesName && matchesRole && matchesTitle && matchesContact && matchesLoc && matchesVisa;
  });

  const handleDownloadCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Role",
      "Title / Role",
      "Contact Info",
      "Location",
      "Visa Type",
      "LinkedIn",
      "Certifications"
    ];

    const csvData = filteredUsers.map(user => {
      const userTitle = (user.role === 'candidate' ? user.details?.desired_job_title : (user.details?.job_title || user.details?.recruiter_job_title)) || '';
      const userVisa = user.details?.work_authorization || user.details?.visa_type || '';
      const userContactInfo = user.details?.phone || user.phone || '';
      const { city, state } = splitLocation(user.details?.location);
      const userLocation = city !== '-' || state !== '-' ? `${city}, ${state}` : '';
      const linkedin = user.details?.linkedin_url || '';
      const certifications = (user.details?.certifications || []).join('; ');

      const escapeField = (field: string) => `"${field.replace(/"/g, '""')}"`;

      return [
        escapeField(user.full_name || ''),
        escapeField(user.email || ''),
        escapeField(user.role || ''),
        escapeField(userTitle),
        escapeField(userContactInfo),
        escapeField(userLocation),
        escapeField(userVisa),
        escapeField(linkedin),
        escapeField(certifications)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm bg-card">
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] px-6 py-5 text-muted-foreground whitespace-nowrap">Entity Identity</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap">
                   <FilterHeader label="Title / Role" filterValue={filterTitle} setFilterValue={setFilterTitle} />
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap">
                   <FilterHeader label="Contact Info" filterValue={filterContact} setFilterValue={setFilterContact} />
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap">
                   <FilterHeader label="Location" filterValue={filterLocation} setFilterValue={setFilterLocation} />
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap">
                   <FilterHeader label="Visa Type" filterValue={filterVisa} setFilterValue={setFilterVisa} />
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap">LinkedIn</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap">Access Layer</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap">Certifications</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] px-6 py-5 text-muted-foreground whitespace-nowrap">Governance</TableHead>
              </TableRow>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead colSpan={9} className="px-6 py-4 bg-card">
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
                    <Button onClick={handleDownloadCSV} variant="outline" className="h-11 font-bold text-xs uppercase tracking-widest bg-muted/20 border-border/40 hover:bg-primary/20">
                      <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-24">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Synchronizing Registry...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-24 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 opacity-20" />
                    <span className="text-sm font-bold opacity-40">No entities found in this sector.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const { city, state } = splitLocation(user.details?.location);
                 const displayName = getDisplayName(user);
                 const displayEmail = getDisplayEmail(user);
                 const displayInitials = displayName.substring(0, 2).toUpperCase();
                return (
                <TableRow key={user.id} className="group border-border/40 hover:bg-muted/10 transition-colors">
                  <TableCell className="px-6 py-4 max-w-[200px]">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center font-black text-primary text-xs tracking-tighter shrink-0 shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        {displayInitials || '??'}
                        </div>
                        <div className="flex flex-col min-w-0">
                        <span className="font-black text-sm tracking-tight truncate uppercase">{displayName}</span>
                        <span className="text-[11px] text-muted-foreground font-medium truncate">{displayEmail}</span>
                        </div>
                     </div>
                  </TableCell>
                  
                  <TableCell className="py-4 whitespace-nowrap">
                    <span className="text-xs font-medium text-foreground">
                      {user.role === 'candidate' ? user.details?.desired_job_title || 'N/A' : 
                       user.role === 'employer' ? user.details?.job_title || user.details?.recruiter_job_title || 'N/A' : 'N/A'}
                    </span>
                  </TableCell>
                  
                  <TableCell className="py-4 whitespace-nowrap">
                     <div className="flex flex-col">
                       <span className="text-[11px] text-muted-foreground truncate">{user.details?.phone || user.phone || 'N/A'}</span>
                     </div>
                  </TableCell>

                  <TableCell className="py-4 whitespace-nowrap">
                     {(city !== '-' || state !== '-') ? (
                       <span className="text-xs font-medium truncate">{city}, {state}</span>
                     ) : (
                       <span className="text-[11px] text-muted-foreground/50 italic">N/A</span>
                     )}
                  </TableCell>

                  <TableCell className="py-4 whitespace-nowrap truncate max-w-[150px]">
                    {user.details?.work_authorization || user.details?.visa_type ? (
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">
                        {user.details.work_authorization || user.details?.visa_type}
                        </span>
                    ) : (
                        <span className="text-[11px] text-muted-foreground/50 italic">N/A</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                       {user.details?.linkedin_url ? (
                         <a href={user.details.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 transition-colors">
                           <ExternalLink className="h-4 w-4" />
                         </a>
                       ) : (
                         <span className="text-[11px] text-muted-foreground/50 italic">N/A</span>
                       )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-4 whitespace-nowrap">
                     <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 border-transparent shadow-sm">
                        {user.role}
                     </Badge>
                  </TableCell>

                  <TableCell className="py-4 whitespace-nowrap max-w-[150px] truncate" title={(user.details?.certifications || []).join(', ')}>
                     {(user.details?.certifications || []).length > 0 ? (
                       <span className="text-xs font-medium text-foreground">
                         {(user.details.certifications).join(', ')}
                       </span>
                     ) : (
                       <span className="text-[11px] text-muted-foreground/50 italic">N/A</span>
                     )}
                  </TableCell>

                  <TableCell className="text-right px-6 py-4 text-muted-foreground tabular-nums whitespace-nowrap">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <AlertDialog>
                         <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl">
                               <Trash2 className="h-4 w-4" />
                            </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent className="border-destructive/20 bg-destructive/5 sm:rounded-3xl">
                            <AlertDialogHeader>
                               <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter text-destructive">Eradicate Entity?</AlertDialogTitle>
                               <AlertDialogDescription className="text-sm font-medium text-destructive/80">
                                  This command is irreversible. All data, clearance levels, and operational history will be purged from the central database.
                               </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                               <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-xs h-12">Halt</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="rounded-xl font-bold uppercase tracking-widest text-xs h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                  Execute Purge
                               </AlertDialogAction>
                            </AlertDialogFooter>
                         </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
              })
            )}
          </TableBody>
        </Table>
       </div>
      </div>
    </div>
  );
};

export default UsersTab;