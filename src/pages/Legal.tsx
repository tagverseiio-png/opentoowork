import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LegalContent from "@/components/LegalContent";
import EditableSection from "@/components/EditableSection";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const Legal = () => {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
    checkUserRole();
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

  const fetchContent = async () => {
    try {
      const { data } = await supabase
        .from("site_content")
        .select("section_key, content")
        .eq("section_key", "legal_page");

      if (data && data.length > 0) {
        setContent(data[0].content || {});
      } else {
        setContent({});
      }
    } catch (err) {
      console.error("Error fetching content:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <EditableSection
          sectionKey="legal_page"
          content={content}
          userRole={userRole}
          onSave={(newContent) => setContent(newContent)}
        >
          <LegalContent />
        </EditableSection>
      </main>
      <Footer />
    </div>
  );
};

export default Legal;
