import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, Upload, FileEdit, Layout, Info, Layers, Phone, FileText, Scale, Scroll } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type PageType = "homepage" | "about" | "legal" | "policy" | "terms";

const ContentTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editPage, setEditPage] = useState<PageType | null>(null);
  const [content, setContent] = useState<any>({});

  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    try {
      const { data } = await supabase
        .from("site_content")
        .select("section_key, content");

      if (data) {
        const contentMap: any = {};
        data.forEach((item) => {
          contentMap[item.section_key] = item.content;
        });
        setContent(contentMap);
      }
    } catch (err) {
      console.error("Error fetching content:", err);
    }
  };

  const handleSave = async (sectionKey: string, sectionContent: any) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("site_content")
      .upsert(
        {
          section_key: sectionKey,
          content: sectionContent,
          last_updated_by: user?.id,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'section_key' }
      );

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${sectionKey} updated successfully!` });
      setContent((prev) => ({ ...prev, [sectionKey]: sectionContent }));
    }
    setLoading(false);
  };

  const handleChange = (section: string, field: string, value: any) => {
    setContent((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleArrayItemChange = (section: string, arrayField: string, index: number, field: string, value: any) => {
    setContent((prev) => {
      const newContent = { ...prev[section] };
      if (!newContent[arrayField]) newContent[arrayField] = [];
      newContent[arrayField][index] = { ...newContent[arrayField][index], [field]: value };
      return { ...prev, [section]: newContent };
    });
  };

  const handleAddArrayItem = (section: string, arrayField: string, newItem: any) => {
    setContent((prev) => {
      const newContent = { ...prev[section] };
      if (!newContent[arrayField]) newContent[arrayField] = [];
      newContent[arrayField].push(newItem);
      return { ...prev, [section]: newContent };
    });
  };

  const handleRemoveArrayItem = (section: string, arrayField: string, index: number) => {
    setContent((prev) => {
      const newContent = { ...prev[section] };
      newContent[arrayField].splice(index, 1);
      return { ...prev, [section]: newContent };
    });
  };

  // Show page selector if no page selected
  if (!editPage) {
    return (
      <div className="max-w-6xl space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Site Content Management</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="group cursor-pointer border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 rounded-[2rem] overflow-hidden" onClick={() => setEditPage("homepage")}>
            <div className="h-2 bg-primary/10 group-hover:bg-primary transition-colors duration-500" />
            <CardHeader className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                <Layout className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tighter">Homepage Matrix</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <p className="text-muted-foreground font-medium leading-relaxed">
                Configure the primary entry point: Hero sequences, value propositions, and operational workflows.
              </p>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 rounded-[2rem] overflow-hidden" onClick={() => setEditPage("about")}>
            <div className="h-2 bg-primary/10 group-hover:bg-primary transition-colors duration-500" />
            <CardHeader className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tighter">About Sector</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <p className="text-muted-foreground font-medium leading-relaxed">
                Manage the narrative: Mission statements, core values, and communication channels.
              </p>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 rounded-[2rem] overflow-hidden" onClick={() => setEditPage("legal")}>
            <div className="h-2 bg-primary/10 group-hover:bg-primary transition-colors duration-500" />
            <CardHeader className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tighter">Legal Hub</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <p className="text-muted-foreground font-medium leading-relaxed">
                Configure compliance documentation: Legal disclosures, privacy notices, and regulatory information.
              </p>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 rounded-[2rem] overflow-hidden" onClick={() => setEditPage("policy")}>
            <div className="h-2 bg-primary/10 group-hover:bg-primary transition-colors duration-500" />
            <CardHeader className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tighter">Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <p className="text-muted-foreground font-medium leading-relaxed">
                Manage data privacy: Collection practices, user rights, and data protection protocols.
              </p>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 rounded-[2rem] overflow-hidden" onClick={() => setEditPage("terms")}>
            <div className="h-2 bg-primary/10 group-hover:bg-primary transition-colors duration-500" />
            <CardHeader className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                <Scroll className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tighter">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <p className="text-muted-foreground font-medium leading-relaxed">
                Service agreements: Platform terms, user obligations, and liability disclaimers.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Homepage editing
  if (editPage === "homepage") {
    const heroSection = content.homepage_hero_section || {
      title: "",
      subtitle: "",
      description: ""
    };

    const whyChooseUs = content.homepage_why_choose_us || {
      title: "",
      subtitle: "",
      items: []
    };

    const howItWorks = content.homepage_how_it_works || {
      title: "",
      subtitle: "",
      steps: []
    };

    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit Homepage</h2>
          <Button variant="outline" onClick={() => setEditPage(null)}>
            Back to Page Selection
          </Button>
        </div>

        <Tabs defaultValue="hero" className="w-full">
          <TabsList className="flex w-fit bg-muted/30 p-1.5 rounded-2xl border border-border/40 mb-8">
            <TabsTrigger value="hero" className="px-8 rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Core Hero</TabsTrigger>
            <TabsTrigger value="why" className="px-8 rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Value Prop</TabsTrigger>
            <TabsTrigger value="how" className="px-8 rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Workflow</TabsTrigger>
          </TabsList>

          {/* Hero Section Tab */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hero-title">Title</Label>
                  <Input
                    id="hero-title"
                    value={heroSection.title || ""}
                    onChange={(e) => handleChange("homepage_hero_section", "title", e.target.value)}
                    placeholder="Main title"
                  />
                </div>

                <div>
                  <Label htmlFor="hero-subtitle">Subtitle</Label>
                  <Input
                    id="hero-subtitle"
                    value={heroSection.subtitle || ""}
                    onChange={(e) => handleChange("homepage_hero_section", "subtitle", e.target.value)}
                    placeholder="Subtitle"
                  />
                </div>

                <div>
                  <Label htmlFor="hero-desc">Description</Label>
                  <Textarea
                    id="hero-desc"
                    value={heroSection.description || ""}
                    onChange={(e) => handleChange("homepage_hero_section", "description", e.target.value)}
                    placeholder="Platform description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="hero-image">Background Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-accent/50 transition-colors">
                    <Input
                      id="hero-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            handleChange("homepage_hero_section", "hero_image", base64);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="cursor-pointer"
                    />
                    <Upload className="h-6 w-6 mx-auto mt-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Click to upload or drag and drop</p>
                  </div>
                  {heroSection.hero_image && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold mb-2">Preview:</p>
                      <img src={heroSection.hero_image} alt="Hero preview" className="max-h-48 rounded-lg object-cover w-full" />
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleSave("homepage_hero_section", heroSection)}
                  disabled={loading}
                  className="gap-2 bg-primary"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Why Choose Us Tab */}
          <TabsContent value="why">
            <Card>
              <CardHeader>
                <CardTitle>Why Choose Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="why-title">Section Title</Label>
                  <Input
                    id="why-title"
                    value={whyChooseUs.title || ""}
                    onChange={(e) => handleChange("homepage_why_choose_us", "title", e.target.value)}
                    placeholder="Why Choose OPENTOOWORK?"
                  />
                </div>

                <div>
                  <Label htmlFor="why-subtitle">Section Subtitle</Label>
                  <Input
                    id="why-subtitle"
                    value={whyChooseUs.subtitle || ""}
                    onChange={(e) => handleChange("homepage_why_choose_us", "subtitle", e.target.value)}
                    placeholder="Subtitle"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label>Features</Label>
                    <Button
                      onClick={() =>
                        handleAddArrayItem("homepage_why_choose_us", "items", {
                          title: "New Feature",
                          description: ""
                        })
                      }
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Feature
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {(whyChooseUs.items || []).map((item: any, idx: number) => (
                      <Card key={idx} className="p-4 bg-card/50">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-semibold">Feature {idx + 1}</span>
                          <Button
                            onClick={() =>
                              handleRemoveArrayItem("homepage_why_choose_us", "items", idx)
                            }
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          value={item.title || ""}
                          onChange={(e) =>
                            handleArrayItemChange(
                              "homepage_why_choose_us",
                              "items",
                              idx,
                              "title",
                              e.target.value
                            )
                          }
                          placeholder="Feature title"
                          className="mb-2"
                        />
                        <Textarea
                          value={item.description || ""}
                          onChange={(e) =>
                            handleArrayItemChange(
                              "homepage_why_choose_us",
                              "items",
                              idx,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Feature description"
                          rows={2}
                        />
                      </Card>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleSave("homepage_why_choose_us", whyChooseUs)}
                  disabled={loading}
                  className="gap-2 bg-primary"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* How It Works Tab */}
          <TabsContent value="how">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="how-title">Title</Label>
                  <Input
                    id="how-title"
                    value={howItWorks.title || ""}
                    onChange={(e) => handleChange("homepage_how_it_works", "title", e.target.value)}
                    placeholder="Section title"
                  />
                </div>

                <div>
                  <Label htmlFor="how-subtitle">Subtitle</Label>
                  <Input
                    id="how-subtitle"
                    value={howItWorks.subtitle || ""}
                    onChange={(e) => handleChange("homepage_how_it_works", "subtitle", e.target.value)}
                    placeholder="Subtitle"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label>Steps</Label>
                    <Button
                      onClick={() =>
                        handleAddArrayItem("homepage_how_it_works", "steps", {
                          number: (howItWorks.steps?.length || 0) + 1,
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

                  <div className="space-y-3">
                    {(howItWorks.steps || []).map((step: any, idx: number) => (
                      <Card key={idx} className="p-4 bg-card/50">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-semibold">Step {idx + 1}</span>
                          <Button
                            onClick={() =>
                              handleRemoveArrayItem("homepage_how_it_works", "steps", idx)
                            }
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          value={step.title || ""}
                          onChange={(e) =>
                            handleArrayItemChange(
                              "homepage_how_it_works",
                              "steps",
                              idx,
                              "title",
                              e.target.value
                            )
                          }
                          placeholder="Step title"
                          className="mb-2"
                        />
                        <Textarea
                          value={step.description || ""}
                          onChange={(e) =>
                            handleArrayItemChange(
                              "homepage_how_it_works",
                              "steps",
                              idx,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Step description"
                          rows={2}
                        />
                      </Card>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleSave("homepage_how_it_works", howItWorks)}
                  disabled={loading}
                  className="gap-2 bg-primary"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // About Page editing
  if (editPage === "about") {
    const heroSection = content.about_hero_section || {
      hero_title: "",
      hero_description: ""
    };

    const whyChooseUs = content.about_why_choose_us || {
      title: "",
      subtitle: "",
      items: []
    };

    const missionSection = content.about_mission_section || {
      mission_title: "",
      mission_body: ""
    };

    const howItWorks = content.about_how_it_works || {
      title: "",
      subtitle: "",
      steps: []
    };

    const contactSection = content.about_contact_section || {
      contact_email: "",
      contact_phone: "",
      contact_address: ""
    };

    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit About Page</h2>
          <Button variant="outline" onClick={() => setEditPage(null)}>
            Back to Page Selection
          </Button>
        </div>

        <Tabs defaultValue="hero" className="w-full">
          <TabsList className="flex flex-wrap w-fit bg-muted/30 p-1.5 rounded-2xl border border-border/40 mb-8 gap-1">
            <TabsTrigger value="hero" className="px-6 rounded-xl font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Hero</TabsTrigger>
            <TabsTrigger value="why" className="px-6 rounded-xl font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Value</TabsTrigger>
            <TabsTrigger value="mission" className="px-6 rounded-xl font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Mission</TabsTrigger>
            <TabsTrigger value="how" className="px-6 rounded-xl font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Process</TabsTrigger>
            <TabsTrigger value="contact" className="px-6 rounded-xl font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Registry</TabsTrigger>
          </TabsList>

          {/* Hero Section Tab */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="about-hero-title">Hero Title</Label>
                  <Input
                    id="about-hero-title"
                    value={heroSection.hero_title || ""}
                    onChange={(e) => handleChange("about_hero_section", "hero_title", e.target.value)}
                    placeholder="About Open Too Work"
                  />
                </div>

                <div>
                  <Label htmlFor="about-hero-desc">Hero Description</Label>
                  <Textarea
                    id="about-hero-desc"
                    value={heroSection.hero_description || ""}
                    onChange={(e) => handleChange("about_hero_section", "hero_description", e.target.value)}
                    placeholder="Hero description"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => handleSave("about_hero_section", heroSection)}
                  disabled={loading}
                  className="gap-2 bg-primary"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Why Choose Us Tab */}
          <TabsContent value="why">
            <Card>
              <CardHeader>
                <CardTitle>Why Choose Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="about-why-title">Section Title</Label>
                  <Input
                    id="about-why-title"
                    value={whyChooseUs.title || ""}
                    onChange={(e) => handleChange("about_why_choose_us", "title", e.target.value)}
                    placeholder="Why Choose OPENTOOWORK?"
                  />
                </div>

                <div>
                  <Label htmlFor="about-why-subtitle">Section Subtitle</Label>
                  <Input
                    id="about-why-subtitle"
                    value={whyChooseUs.subtitle || ""}
                    onChange={(e) => handleChange("about_why_choose_us", "subtitle", e.target.value)}
                    placeholder="Subtitle"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label>Features</Label>
                    <Button
                      onClick={() =>
                        handleAddArrayItem("about_why_choose_us", "items", {
                          title: "New Feature",
                          description: ""
                        })
                      }
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Feature
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {(whyChooseUs.items || []).map((item: any, idx: number) => (
                      <Card key={idx} className="p-4 bg-card/50">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-semibold">Feature {idx + 1}</span>
                          <Button
                            onClick={() =>
                              handleRemoveArrayItem("about_why_choose_us", "items", idx)
                            }
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          value={item.title || ""}
                          onChange={(e) =>
                            handleArrayItemChange(
                              "about_why_choose_us",
                              "items",
                              idx,
                              "title",
                              e.target.value
                            )
                          }
                          placeholder="Feature title"
                          className="mb-2"
                        />
                        <Textarea
                          value={item.description || ""}
                          onChange={(e) =>
                            handleArrayItemChange(
                              "about_why_choose_us",
                              "items",
                              idx,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Feature description"
                          rows={2}
                        />
                      </Card>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleSave("about_why_choose_us", whyChooseUs)}
                  disabled={loading}
                  className="gap-2 bg-primary"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mission Tab */}
          <TabsContent value="mission">
            <Card>
              <CardHeader>
                <CardTitle>Mission Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mission-title">Mission Title</Label>
                  <Input
                    id="mission-title"
                    value={missionSection.mission_title || ""}
                    onChange={(e) => handleChange("about_mission_section", "mission_title", e.target.value)}
                    placeholder="Our Mission"
                  />
                </div>

                <div>
                  <Label htmlFor="mission-body">Mission Statement</Label>
                  <Textarea
                    id="mission-body"
                    value={missionSection.mission_body || ""}
                    onChange={(e) => handleChange("about_mission_section", "mission_body", e.target.value)}
                    placeholder="Your mission statement..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={() => handleSave("about_mission_section", missionSection)}
                  disabled={loading}
                  className="gap-2 bg-primary"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* How It Works Tab */}
          <TabsContent value="how">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="about-how-title">Title</Label>
                  <Input
                    id="about-how-title"
                    value={howItWorks.title || ""}
                    onChange={(e) => handleChange("about_how_it_works", "title", e.target.value)}
                    placeholder="Section title"
                  />
                </div>

                <div>
                  <Label htmlFor="about-how-subtitle">Subtitle</Label>
                  <Input
                    id="about-how-subtitle"
                    value={howItWorks.subtitle || ""}
                    onChange={(e) => handleChange("about_how_it_works", "subtitle", e.target.value)}
                    placeholder="Subtitle"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label>Steps</Label>
                    <Button
                      onClick={() =>
                        handleAddArrayItem("about_how_it_works", "steps", {
                          number: (howItWorks.steps?.length || 0) + 1,
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

                  <div className="space-y-3">
                    {(howItWorks.steps || []).map((step: any, idx: number) => (
                      <Card key={idx} className="p-4 bg-card/50">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-semibold">Step {idx + 1}</span>
                          <Button
                            onClick={() =>
                              handleRemoveArrayItem("about_how_it_works", "steps", idx)
                            }
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          value={step.title || ""}
                          onChange={(e) =>
                            handleArrayItemChange(
                              "about_how_it_works",
                              "steps",
                              idx,
                              "title",
                              e.target.value
                            )
                          }
                          placeholder="Step title"
                          className="mb-2"
                        />
                        <Textarea
                          value={step.description || ""}
                          onChange={(e) =>
                            handleArrayItemChange(
                              "about_how_it_works",
                              "steps",
                              idx,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Step description"
                          rows={2}
                        />
                      </Card>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleSave("about_how_it_works", howItWorks)}
                  disabled={loading}
                  className="gap-2 bg-primary"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactSection.contact_email || ""}
                    onChange={(e) => handleChange("about_contact_section", "contact_email", e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-address">Contact Address</Label>
                  <Textarea
                    id="contact-address"
                    value={contactSection.contact_address || ""}
                    onChange={(e) => handleChange("about_contact_section", "contact_address", e.target.value)}
                    placeholder="Address"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => handleSave("about_contact_section", contactSection)}
                  disabled={loading}
                  className="gap-2 bg-primary"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Legal Page editing
  if (editPage === "legal") {
    const legalContent = content.legal_page || {
      legal_title: "",
      legal_body: ""
    };

    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit Legal Page</h2>
          <Button variant="outline" onClick={() => setEditPage(null)}>
            Back to Page Selection
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Legal Page Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="legal-title">Page Title</Label>
              <Input
                id="legal-title"
                value={legalContent.legal_title || ""}
                onChange={(e) => handleChange("legal_page", "legal_title", e.target.value)}
                placeholder="Legal Information"
              />
            </div>

            <div>
              <Label htmlFor="legal-body">Page Content</Label>
              <Textarea
                id="legal-body"
                value={legalContent.legal_body || ""}
                onChange={(e) => handleChange("legal_page", "legal_body", e.target.value)}
                placeholder="Enter legal page content..."
                rows={10}
              />
            </div>

            <Button
              onClick={() => handleSave("legal_page", legalContent)}
              disabled={loading}
              className="gap-2 bg-primary"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Legal Page"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Policy Page editing
  if (editPage === "policy") {
    const policyContent = content.policy_page || {
      policy_title: "",
      policy_body: ""
    };

    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit Privacy Policy</h2>
          <Button variant="outline" onClick={() => setEditPage(null)}>
            Back to Page Selection
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Privacy Policy Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="policy-title">Policy Title</Label>
              <Input
                id="policy-title"
                value={policyContent.policy_title || ""}
                onChange={(e) => handleChange("policy_page", "policy_title", e.target.value)}
                placeholder="Privacy Policy"
              />
            </div>

            <div>
              <Label htmlFor="policy-body">Policy Content</Label>
              <Textarea
                id="policy-body"
                value={policyContent.policy_body || ""}
                onChange={(e) => handleChange("policy_page", "policy_body", e.target.value)}
                placeholder="Enter privacy policy content..."
                rows={10}
              />
            </div>

            <Button
              onClick={() => handleSave("policy_page", policyContent)}
              disabled={loading}
              className="gap-2 bg-primary"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Privacy Policy"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Terms Page editing
  if (editPage === "terms") {
    const termsContent = content.terms_page || {
      terms_title: "",
      terms_body: ""
    };

    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit Terms & Conditions</h2>
          <Button variant="outline" onClick={() => setEditPage(null)}>
            Back to Page Selection
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="terms-title">Terms Title</Label>
              <Input
                id="terms-title"
                value={termsContent.terms_title || ""}
                onChange={(e) => handleChange("terms_page", "terms_title", e.target.value)}
                placeholder="Terms & Conditions"
              />
            </div>

            <div>
              <Label htmlFor="terms-body">Terms Content</Label>
              <Textarea
                id="terms-body"
                value={termsContent.terms_body || ""}
                onChange={(e) => handleChange("terms_page", "terms_body", e.target.value)}
                placeholder="Enter terms and conditions content..."
                rows={10}
              />
            </div>

            <Button
              onClick={() => handleSave("terms_page", termsContent)}
              disabled={loading}
              className="gap-2 bg-primary"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Terms & Conditions"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
};

export default ContentTab;
