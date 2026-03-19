import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import UsersTab from "./admin/UsersTab";
import JobsTab from "./admin/JobsTab";
import ContentTab from "./admin/ContentTab";
import { ShieldCheck, Users, Briefcase, FileCheck, TrendingUp, RefreshCw, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    jobs: 0,
    applications: 0,
    activeJobs: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const [{ count: userCount }, { count: jobCount }, { count: appCount }, { count: activeJobCount }] = await Promise.all([
      supabase.from("profiles").select("*", { count: 'exact', head: true }),
      supabase.from("jobs").select("*", { count: 'exact', head: true }),
      supabase.from("applications").select("*", { count: 'exact', head: true }),
      supabase.from("jobs").select("*", { count: 'exact', head: true }).eq('is_active', true)
    ]);

    const { data: subs } = await supabase.from("subscriptions").select("plan_type");
    let calculatedRevenue = 0;
    subs?.forEach(sub => {
       if (sub.plan_type === "Basic") calculatedRevenue += 49;
       if (sub.plan_type === "Professional") calculatedRevenue += 99;
       if (sub.plan_type === "Enterprise") calculatedRevenue += 499;
    });

    setStats({
      users: userCount || 0,
      jobs: jobCount || 0,
      applications: appCount || 0,
      activeJobs: activeJobCount || 0,
      revenue: calculatedRevenue
    });
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b pb-8 border-border/40">
        <div className="flex items-center gap-5">
           <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm shadow-primary/5">
             <ShieldCheck className="h-10 w-10 text-primary" />
           </div>
           <div>
             <h1 className="text-4xl font-black tracking-tighter uppercase">Systems Overlook</h1>
             <p className="text-muted-foreground font-medium">Enterprise Management & Platform Governance</p>
           </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="h-11 px-6 font-bold uppercase tracking-widest text-[11px] border-muted-foreground/20 group" onClick={fetchStats} disabled={loading}>
              <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
              Sync Data
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
         {[
            { label: "Total Users", value: stats.users, icon: Users, color: "blue" },
            { label: "Total Jobs", value: stats.jobs, icon: Briefcase, color: "orange" },
            { label: "Submissions", value: stats.applications, icon: FileCheck, color: "green" },
            { label: "Live Listings", value: stats.activeJobs, icon: TrendingUp, color: "purple" },
            { label: "Proj. ARR ($)", value: stats.revenue, icon: DollarSign, color: "emerald" }
         ].map((item, idx) => (
            <Card key={idx} className="p-6 border-border/50 shadow-sm hover:shadow-md transition-all group">
               <div className="flex justify-between items-start">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                     <h2 className="text-4xl font-black tabular-nums tracking-tighter">{item.value.toLocaleString()}</h2>
                  </div>
                  <div className={`p-3 rounded-xl bg-primary/5 text-primary group-hover:scale-110 transition-transform`}>
                     <item.icon className="h-5 w-5" />
                  </div>
               </div>
            </Card>
         ))}
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="flex w-fit bg-muted/30 p-1.5 rounded-2xl border border-border/40 mb-2">
          <TabsTrigger value="users" className="px-8 rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Registry</TabsTrigger>
          <TabsTrigger value="jobs" className="px-8 rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Inventory</TabsTrigger>
          <TabsTrigger value="content" className="px-8 rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Publisher</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="p-8 border-border/50 shadow-sm rounded-3xl">
            <UsersTab />
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card className="p-8 border-border/50 shadow-sm rounded-3xl">
            <JobsTab />
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <ContentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;