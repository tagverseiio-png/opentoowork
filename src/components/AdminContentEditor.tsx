import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Edit2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminContentEditor = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [editingForm, setEditingForm] = useState<any>({});
  const [activeTab, setActiveTab] = useState("hero_section");

  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    try {
      const { data, error } = await supabase
        .from("site_content")
        .select("section_key, content");

      if (error) throw error;

      const contentMap: any = {};
      data?.forEach((item) => {
        contentMap[item.section_key] = item.content;
      });
      setSections(contentMap);
      setEditingForm(JSON.parse(JSON.stringify(contentMap)));
    } catch (error: any) {
      toast({
        title: "Error loading content",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async (sectionKey: string) => {
    try {
      const { error } = await supabase
        .from("site_content")
        .upsert(
          { section_key: sectionKey, content: editingForm[sectionKey] || {} },
          { onConflict: "section_key" }
        );

      if (error) throw error;

      setSections({
        ...sections,
        [sectionKey]: editingForm[sectionKey]
      });

      toast({
        title: "Success",
        description: `${sectionKey} saved successfully!`
      });
    } catch (error: any) {
      toast({
        title: "Error saving content",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateNestedField = (sectionKey: string, path: string[], value: any) => {
    const updated = { ...editingForm };
    let current = updated[sectionKey];
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    
    setEditingForm(updated);
  };

  const addArrayItem = (sectionKey: string, arrayPath: string[], template: any) => {
    const updated = { ...editingForm };
    const path = arrayPath.slice(0, -1);
    let current = updated[sectionKey];
    
    for (let i = 0; i < path.length; i++) {
      current = current[path[i]];
    }
    
    if (!Array.isArray(current[arrayPath[arrayPath.length - 1]])) {
      current[arrayPath[arrayPath.length - 1]] = [];
    }
    current[arrayPath[arrayPath.length - 1]].push(JSON.parse(JSON.stringify(template)));
    
    setEditingForm(updated);
  };

  const removeArrayItem = (sectionKey: string, arrayPath: string[], index: number) => {
    const updated = { ...editingForm };
    const path = arrayPath.slice(0, -1);
    let current = updated[sectionKey];
    
    for (let i = 0; i < path.length; i++) {
      current = current[path[i]];
    }
    
    current[arrayPath[arrayPath.length - 1]].splice(index, 1);
    setEditingForm(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Content Management</h1>
          <p className="text-muted-foreground">Edit all site content dynamically</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hero_section">Hero</TabsTrigger>
            <TabsTrigger value="why_choose_us">Features</TabsTrigger>
            <TabsTrigger value="mission_section">Mission</TabsTrigger>
            <TabsTrigger value="how_it_works">How It Works</TabsTrigger>
            <TabsTrigger value="about_page">About</TabsTrigger>
          </TabsList>

          {/* Hero Section */}
          <TabsContent value="hero_section" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Hero Section</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Main Title</label>
                  <Input
                    value={editingForm.hero_section?.title || ""}
                    onChange={(e) => updateNestedField("hero_section", ["title"], e.target.value)}
                    placeholder="e.g. Unlock Your Next Great Opportunity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Subtitle</label>
                  <Input
                    value={editingForm.hero_section?.subtitle || ""}
                    onChange={(e) => updateNestedField("hero_section", ["subtitle"], e.target.value)}
                    placeholder="e.g. Search. Apply. Grow. Your journey starts now."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Description</label>
                  <Textarea
                    value={editingForm.hero_section?.description || ""}
                    onChange={(e) => updateNestedField("hero_section", ["description"], e.target.value)}
                    placeholder="Brief platform description..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={() => handleSaveSection("hero_section")}
                  className="gap-2 bg-primary"
                >
                  <Save className="h-4 w-4" />
                  Save Hero Section
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Why Choose Us */}
          <TabsContent value="why_choose_us" className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Features / Why Choose Us</h2>
                <Button
                  onClick={() => addArrayItem("why_choose_us", ["items"], { title: "New Feature", description: "" })}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Feature
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Section Title</label>
                  <Input
                    value={editingForm.why_choose_us?.title || ""}
                    onChange={(e) => updateNestedField("why_choose_us", ["title"], e.target.value)}
                    placeholder="e.g. Why Choose Open Too Work"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {(editingForm.why_choose_us?.items || []).map((item: any, idx: number) => (
                  <Card key={idx} className="p-4 bg-card/50">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold">Feature {idx + 1}</h3>
                      <Button
                        onClick={() => removeArrayItem("why_choose_us", ["items"], idx)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Input
                        value={item.title || ""}
                        onChange={(e) => {
                          const items = [...editingForm.why_choose_us.items];
                          items[idx].title = e.target.value;
                          updateNestedField("why_choose_us", ["items"], items);
                        }}
                        placeholder="Feature title"
                      />
                      <Textarea
                        value={item.description || ""}
                        onChange={(e) => {
                          const items = [...editingForm.why_choose_us.items];
                          items[idx].description = e.target.value;
                          updateNestedField("why_choose_us", ["items"], items);
                        }}
                        placeholder="Feature description"
                        rows={3}
                      />
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                onClick={() => handleSaveSection("why_choose_us")}
                className="gap-2 bg-primary mt-6"
              >
                <Save className="h-4 w-4" />
                Save Features
              </Button>
            </Card>
          </TabsContent>

          {/* Mission Section */}
          <TabsContent value="mission_section" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Mission Section</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Mission Title</label>
                  <Input
                    value={editingForm.mission_section?.title || ""}
                    onChange={(e) => updateNestedField("mission_section", ["title"], e.target.value)}
                    placeholder="e.g. Our Mission"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Mission Statement</label>
                  <Textarea
                    value={editingForm.mission_section?.subtitle || ""}
                    onChange={(e) => updateNestedField("mission_section", ["subtitle"], e.target.value)}
                    placeholder="Your mission statement..."
                    rows={4}
                  />
                </div>
                <Button
                  onClick={() => handleSaveSection("mission_section")}
                  className="gap-2 bg-primary"
                >
                  <Save className="h-4 w-4" />
                  Save Mission
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* How It Works */}
          <TabsContent value="how_it_works" className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">How It Works</h2>
                <Button
                  onClick={() =>
                    addArrayItem("how_it_works", ["steps"], {
                      number: (editingForm.how_it_works?.steps?.length || 0) + 1,
                      title: "New Step",
                      description: ""
                    })
                  }
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Step
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Section Title</label>
                  <Input
                    value={editingForm.how_it_works?.title || ""}
                    onChange={(e) => updateNestedField("how_it_works", ["title"], e.target.value)}
                    placeholder="e.g. How It Works"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Subtitle</label>
                  <Input
                    value={editingForm.how_it_works?.subtitle || ""}
                    onChange={(e) => updateNestedField("how_it_works", ["subtitle"], e.target.value)}
                    placeholder="e.g. Your path to amazing opportunities starts here"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {(editingForm.how_it_works?.steps || []).map((step: any, idx: number) => (
                  <Card key={idx} className="p-4 bg-card/50">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold">Step {idx + 1}</h3>
                      <Button
                        onClick={() => removeArrayItem("how_it_works", ["steps"], idx)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Input
                        value={step.title || ""}
                        onChange={(e) => {
                          const steps = [...editingForm.how_it_works.steps];
                          steps[idx].title = e.target.value;
                          updateNestedField("how_it_works", ["steps"], steps);
                        }}
                        placeholder="Step title"
                      />
                      <Textarea
                        value={step.description || ""}
                        onChange={(e) => {
                          const steps = [...editingForm.how_it_works.steps];
                          steps[idx].description = e.target.value;
                          updateNestedField("how_it_works", ["steps"], steps);
                        }}
                        placeholder="Step description"
                        rows={3}
                      />
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                onClick={() => handleSaveSection("how_it_works")}
                className="gap-2 bg-primary mt-6"
              >
                <Save className="h-4 w-4" />
                Save How It Works
              </Button>
            </Card>
          </TabsContent>

          {/* About Page */}
          <TabsContent value="about_page" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">About Page Content</h2>
              
              <div className="space-y-6">
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-4">Hero Section</h3>
                  <div className="space-y-3">
                    <Input
                      value={editingForm.about_page?.hero_title || ""}
                      onChange={(e) => updateNestedField("about_page", ["hero_title"], e.target.value)}
                      placeholder="Hero title"
                    />
                    <Textarea
                      value={editingForm.about_page?.hero_description || ""}
                      onChange={(e) => updateNestedField("about_page", ["hero_description"], e.target.value)}
                      placeholder="Hero description"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-4">Mission Section</h3>
                  <div className="space-y-3">
                    <Input
                      value={editingForm.about_page?.mission_title || ""}
                      onChange={(e) => updateNestedField("about_page", ["mission_title"], e.target.value)}
                      placeholder="Mission title"
                    />
                    <Textarea
                      value={editingForm.about_page?.mission_body || ""}
                      onChange={(e) => updateNestedField("about_page", ["mission_body"], e.target.value)}
                      placeholder="Mission description"
                      rows={4}
                    />
                  </div>
                </div>

                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-4">Contact Information (leave empty to hide)</h3>
                  <div className="space-y-3">
                    <Input
                      type="email"
                      value={editingForm.about_page?.contact_email || ""}
                      onChange={(e) => updateNestedField("about_page", ["contact_email"], e.target.value)}
                      placeholder="Email"
                    />
                    <Textarea
                      value={editingForm.about_page?.contact_address || ""}
                      onChange={(e) => updateNestedField("about_page", ["contact_address"], e.target.value)}
                      placeholder="Address"
                      rows={3}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Social Media (leave empty to hide)</h3>
                  <div className="space-y-3">
                    <Input
                      value={editingForm.about_page?.social_linkedin || ""}
                      onChange={(e) => updateNestedField("about_page", ["social_linkedin"], e.target.value)}
                      placeholder="LinkedIn URL"
                    />
                    <Input
                      value={editingForm.about_page?.social_twitter || ""}
                      onChange={(e) => updateNestedField("about_page", ["social_twitter"], e.target.value)}
                      placeholder="Twitter URL"
                    />
                    <Input
                      value={editingForm.about_page?.social_facebook || ""}
                      onChange={(e) => updateNestedField("about_page", ["social_facebook"], e.target.value)}
                      placeholder="Facebook URL"
                    />
                    <Input
                      value={editingForm.about_page?.social_instagram || ""}
                      onChange={(e) => updateNestedField("about_page", ["social_instagram"], e.target.value)}
                      placeholder="Instagram URL"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleSaveSection("about_page")}
                className="gap-2 bg-primary mt-6"
              >
                <Save className="h-4 w-4" />
                Save About Page
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminContentEditor;
