import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import JobCard from "@/components/JobCard";
import HeroSection from "@/components/sections/HeroSection";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import HowItWorks from "@/components/sections/HowItWorks";
import EditableSection from "@/components/EditableSection";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [heroContent, setHeroContent] = useState<any>(null);
  const [whyChooseUsContent, setWhyChooseUsContent] = useState<any>(null);
  const [howItWorksContent, setHowItWorksContent] = useState<any>(null);
  
  // Ref for scrolling
  const jobsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchJobs();
    checkUserRole();
    fetchEditableContent();
  }, []);

  const checkUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUserRole(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    setUserRole(data?.role);
  };

  const fetchEditableContent = async () => {
    try {
      const { data } = await supabase
        .from("site_content")
        .select("section_key, content")
        .in("section_key", ["homepage_hero_section", "homepage_why_choose_us", "homepage_how_it_works"]);

      console.log("Fetched site_content data:", data);

      if (data) {
        data.forEach((item) => {
          console.log(`Processing ${item.section_key}:`, item.content);
          const content = item.content || {};
          // Ensure items/steps arrays are always arrays
          if (!Array.isArray(content.items)) {
            content.items = [];
          }
          if (!Array.isArray(content.steps)) {
            content.steps = [];
          }
          
          console.log(`After processing ${item.section_key}:`, content);
          
          if (item.section_key === "homepage_hero_section") {
            setHeroContent(content);
          } else if (item.section_key === "homepage_why_choose_us") {
            console.log("Setting whyChooseUsContent:", content);
            setWhyChooseUsContent(content);
          } else if (item.section_key === "homepage_how_it_works") {
            setHowItWorksContent(content);
          }
        });
      }
    } catch (err) {
      console.error("Error fetching editable content:", err);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    let query = supabase
      .from("jobs")
      .select(`
        *,
        employer:employer_profiles(
          company_name,
          location
        )
      `)
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching jobs:", error);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    // 1. Re-fetch is optional since we filter client-side, 
    // but we can do it to ensure fresh data.
    fetchJobs(); 
    
    // 2. Scroll to the jobs section smoothly
    if (jobsSectionRef.current) {
      jobsSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.toLowerCase();
    const loc = locationFilter.toLowerCase();

    // Check title, description, OR company name
    const matchesSearch =
      !term ||
      job.title.toLowerCase().includes(term) ||
      job.description.toLowerCase().includes(term) ||
      job.employer?.company_name?.toLowerCase().includes(term);
    
    // Check location matches
    const matchesLocation =
      !loc || job.location.toLowerCase().includes(loc);
    
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <EditableSection
        sectionKey="homepage_hero_section"
        content={heroContent || {}}
        userRole={userRole}
        onSave={(newContent) => setHeroContent(newContent)}
      >
        <HeroSection 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          onSearch={handleSearch}
          visaFilter=""
          setVisaFilter={() => {}}
          heroImage={heroContent?.hero_image}
        />
      </EditableSection>

      <EditableSection
        sectionKey="homepage_why_choose_us"
        content={whyChooseUsContent || {}}
        userRole={userRole}
        onSave={(newContent) => setWhyChooseUsContent(newContent)}
      >
        <WhyChooseUs sectionKey="homepage_why_choose_us" />
      </EditableSection>

      <EditableSection
        sectionKey="homepage_how_it_works"
        content={howItWorksContent || {}}
        userRole={userRole}
        onSave={(newContent) => setHowItWorksContent(newContent)}
      >
        <HowItWorks sectionKey="homepage_how_it_works" />
      </EditableSection>

      {/* Jobs Listing Section with Ref */}
      <section 
        ref={jobsSectionRef} 
        className="py-20 bg-gradient-to-b from-background to-primary-light/10"
      >
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-4xl font-bold mb-2">
              Latest Opportunities
            </h2>
            <p className="text-lg text-muted-foreground">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} available
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-muted-foreground">Loading amazing opportunities...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No jobs found matching your criteria.</p>
              <button 
                onClick={() => { setSearchTerm(""); setLocationFilter(""); }}
                className="text-primary hover:underline mt-2"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  id={job.id}
                  title={job.title}
                  company={job.employer?.company_name || "Company"}
                  location={job.location}
                  salaryMin={job.salary_min}
                  salaryMax={job.salary_max}
                  salaryPeriod={job.salary_period}
                  jobType={job.job_type}
                  workAuthorization={job.work_authorization}
                  skills={job.skills_required}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;