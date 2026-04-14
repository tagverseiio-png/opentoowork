import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { Loader2, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Policy = () => {
  const { toast } = useToast();
  const [content, setContent] = useState<any>({
    policy_title: "Privacy Policy",
    policy_body: "Privacy policy content will appear here."
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

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
        .eq("section_key", "policy_page");

      if (data && data.length > 0 && data[0].content) {
        setContent(data[0].content);
      }
    } catch (err) {
      console.error("Error fetching content:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditForm(JSON.parse(JSON.stringify(content)));
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_content")
        .upsert(
          { section_key: "policy_page", content: editForm },
          { onConflict: "section_key" }
        );

      if (error) throw error;

      setContent(editForm);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Privacy policy updated successfully!"
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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
        <div className="container mx-auto max-w-4xl py-12 px-6">
          <div className="flex justify-between items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-3">
                {isEditing ? editForm.policy_title : content.policy_title}
              </h1>
              <p className="text-muted-foreground text-base">
                Important policies and guidelines for using OpenTooWork
              </p>
            </div>
            {userRole === "admin" && !isEditing && (
              <Button onClick={handleEdit} variant="outline" className="gap-2">
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4 bg-card border border-border/50 rounded-2xl p-8">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Title</label>
                <input
                  type="text"
                  value={editForm.policy_title || ""}
                  onChange={(e) => setEditForm({ ...editForm, policy_title: e.target.value })}
                  className="w-full px-4 py-2 border border-border/50 rounded-lg bg-background text-foreground"
                  placeholder="Policy title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Content</label>
                <Textarea
                  value={editForm.policy_body || ""}
                  onChange={(e) => setEditForm({ ...editForm, policy_body: e.target.value })}
                  className="w-full min-h-[400px] px-4 py-2 border border-border/50 rounded-lg bg-background text-foreground"
                  placeholder="Policy content..."
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none bg-card border border-border/50 rounded-2xl p-8">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {content.policy_body || "No content added yet."}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Policy;
