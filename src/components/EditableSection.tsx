import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Save, X, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface EditableSectionProps {
  sectionKey: string;
  content: any;
  userRole: string | null;
  onSave?: (newContent: any) => void;
  children: React.ReactNode;
}

const EditableSection = ({
  sectionKey,
  content,
  userRole,
  onSave,
  children
}: EditableSectionProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(JSON.parse(JSON.stringify(content)));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_content")
        .upsert(
          { section_key: sectionKey, content: editForm },
          { onConflict: "section_key" }
        );

      if (error) throw error;

      toast({
        title: "Success",
        description: `${sectionKey} updated successfully!`
      });

      setIsEditing(false);
      onSave?.(editForm);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path: string[], value: any) => {
    const updated = JSON.parse(JSON.stringify(editForm));
    let current = updated;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!(path[i] in current)) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setEditForm(updated);
  };

  const addArrayItem = (path: string[], template: any) => {
    const updated = JSON.parse(JSON.stringify(editForm));
    let current = updated;
    
    for (let i = 0; i < path.length; i++) {
      if (!(path[i] in current)) {
        current[path[i]] = [];
      }
      current = current[path[i]];
    }
    
    if (!Array.isArray(current)) return;
    current.push(JSON.parse(JSON.stringify(template)));
    setEditForm(updated);
  };

  const removeArrayItem = (path: string[], index: number) => {
    const updated = JSON.parse(JSON.stringify(editForm));
    let current = updated;
    
    for (let i = 0; i < path.length; i++) {
      current = current[path[i]];
    }
    
    if (Array.isArray(current)) {
      current.splice(index, 1);
    }
    setEditForm(updated);
  };

  if (!isEditing) {
    return (
      <div className="relative group">
        {children}
        {userRole === "admin" && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>
    );
  }

  // Edit mode - return a modal/overlay
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit {sectionKey}</h2>
          <Button
            onClick={() => setIsEditing(false)}
            variant="ghost"
            size="icon"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {renderEditFields(editForm, sectionKey, updateField, addArrayItem, removeArrayItem)}
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-primary"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            onClick={() => setIsEditing(false)}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper function to render form fields based on content structure
function renderEditFields(
  data: any,
  sectionKey: string,
  updateField: (path: string[], value: any) => void,
  addArrayItem: (path: string[], template: any) => void,
  removeArrayItem: (path: string[], index: number) => void
): React.ReactNode {
  const fields: React.ReactNode[] = [];

  // Homepage hero section
  if (sectionKey === "hero_section" || sectionKey === "homepage_hero_section") {
    fields.push(
      <div key="title">
        <label className="block text-sm font-semibold mb-2">Title</label>
        <Input
          value={data.title || ""}
          onChange={(e) => updateField(["title"], e.target.value)}
          placeholder="Main title"
        />
      </div>,
      <div key="subtitle">
        <label className="block text-sm font-semibold mb-2">Subtitle</label>
        <Input
          value={data.subtitle || ""}
          onChange={(e) => updateField(["subtitle"], e.target.value)}
          placeholder="Subtitle"
        />
      </div>,
      <div key="description">
        <label className="block text-sm font-semibold mb-2">Description</label>
        <Textarea
          value={data.description || ""}
          onChange={(e) => updateField(["description"], e.target.value)}
          placeholder="Platform description"
          rows={3}
        />
      </div>,
      <div key="hero_image">
        <label className="block text-sm font-semibold mb-2">Hero Background Image</label>
        <div className="space-y-2">
          {data.hero_image && (
            <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
              <img src={data.hero_image} alt="Hero" className="w-full h-full object-cover" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const base64 = event.target?.result as string;
                  updateField(["hero_image"], base64);
                };
                reader.readAsDataURL(file);
              }
            }}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
          />
        </div>
      </div>
    );
  } else if (sectionKey === "why_choose_us" || sectionKey === "homepage_why_choose_us" || sectionKey === "about_why_choose_us") {
    fields.push(
      <div key="title">
        <label className="block text-sm font-semibold mb-2">Section Title</label>
        <Input
          value={data.title || ""}
          onChange={(e) => updateField(["title"], e.target.value)}
          placeholder="Why Choose OPENTOOWORK?"
        />
      </div>,
      <div key="subtitle">
        <label className="block text-sm font-semibold mb-2">Section Subtitle</label>
        <Input
          value={data.subtitle || ""}
          onChange={(e) => updateField(["subtitle"], e.target.value)}
          placeholder="A platform designed to help skilled talent build a successful career in the United States"
        />
      </div>,
      <div key="items">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-semibold">Features</label>
          <Button
            onClick={() => addArrayItem(["items"], { title: "New Feature", description: "" })}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        {(data.items || []).map((item: any, idx: number) => (
          <div key={idx} className="bg-card/50 p-4 rounded-lg mb-3 border border-border">
            <div className="flex justify-between items-start mb-3">
              <span className="font-semibold">Feature {idx + 1}</span>
              <Button
                onClick={() => removeArrayItem(["items"], idx)}
                variant="ghost"
                size="sm"
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={item.title || ""}
              onChange={(e) => {
                const items = [...(data.items || [])];
                items[idx].title = e.target.value;
                updateField(["items"], items);
              }}
              placeholder="Feature title"
              className="mb-2"
            />
            <Textarea
              value={item.description || ""}
              onChange={(e) => {
                const items = [...(data.items || [])];
                items[idx].description = e.target.value;
                updateField(["items"], items);
              }}
              placeholder="Feature description"
              rows={2}
            />
          </div>
        ))}
      </div>
    );
  } else if (sectionKey === "mission_section" || sectionKey === "about_mission_section") {
    fields.push(
      <div key="mission_title">
        <label className="block text-sm font-semibold mb-2">Mission Title</label>
        <Input
          value={data.mission_title || ""}
          onChange={(e) => updateField(["mission_title"], e.target.value)}
          placeholder="Our Mission"
        />
      </div>,
      <div key="mission_body">
        <label className="block text-sm font-semibold mb-2">Mission Statement</label>
        <Textarea
          value={data.mission_body || ""}
          onChange={(e) => updateField(["mission_body"], e.target.value)}
          placeholder="Your mission statement..."
          rows={4}
        />
      </div>
    );
  } else if (sectionKey === "how_it_works" || sectionKey === "homepage_how_it_works" || sectionKey === "about_how_it_works") {
    fields.push(
      <div key="title">
        <label className="block text-sm font-semibold mb-2">Title</label>
        <Input
          value={data.title || ""}
          onChange={(e) => updateField(["title"], e.target.value)}
          placeholder="Section title"
        />
      </div>,
      <div key="subtitle">
        <label className="block text-sm font-semibold mb-2">Subtitle</label>
        <Input
          value={data.subtitle || ""}
          onChange={(e) => updateField(["subtitle"], e.target.value)}
          placeholder="Subtitle"
        />
      </div>,
      <div key="steps">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-semibold">Steps</label>
          <Button
            onClick={() =>
              addArrayItem(["steps"], {
                number: (data.steps?.length || 0) + 1,
                title: "New Step",
                description: ""
              })
            }
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        {(data.steps || []).map((step: any, idx: number) => (
          <div key={idx} className="bg-card/50 p-4 rounded-lg mb-3 border border-border">
            <div className="flex justify-between items-start mb-3">
              <span className="font-semibold">Step {idx + 1}</span>
              <Button
                onClick={() => removeArrayItem(["steps"], idx)}
                variant="ghost"
                size="sm"
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={step.title || ""}
              onChange={(e) => {
                const steps = [...(data.steps || [])];
                steps[idx].title = e.target.value;
                updateField(["steps"], steps);
              }}
              placeholder="Step title"
              className="mb-2"
            />
            <Textarea
              value={step.description || ""}
              onChange={(e) => {
                const steps = [...(data.steps || [])];
                steps[idx].description = e.target.value;
                updateField(["steps"], steps);
              }}
              placeholder="Step description"
              rows={2}
            />
          </div>
        ))}
      </div>
    );
  } else if (sectionKey === "about_page" || sectionKey === "about_hero_section") {
    fields.push(
      <div key="hero_title">
        <label className="block text-sm font-semibold mb-2">Hero Title</label>
        <Input
          value={data.hero_title || ""}
          onChange={(e) => updateField(["hero_title"], e.target.value)}
          placeholder="About Open Too Work"
        />
      </div>,
      <div key="hero_description">
        <label className="block text-sm font-semibold mb-2">Hero Description</label>
        <Textarea
          value={data.hero_description || ""}
          onChange={(e) => updateField(["hero_description"], e.target.value)}
          placeholder="Hero description"
          rows={3}
        />
      </div>
    );
  } else if (sectionKey === "contact_section" || sectionKey === "about_contact_section") {
    fields.push(
      <div key="contact_email">
        <label className="block text-sm font-semibold mb-2">Contact Email (leave empty to hide)</label>
        <Input
          type="email"
          value={data.contact_email || ""}
          onChange={(e) => updateField(["contact_email"], e.target.value)}
          placeholder="Email"
        />
      </div>,
      <div key="contact_phone">
        <label className="block text-sm font-semibold mb-2">Contact Phone</label>
        <Input
          value={data.contact_phone || ""}
          onChange={(e) => updateField(["contact_phone"], e.target.value)}
          placeholder="Phone"
        />
      </div>,
      <div key="contact_address">
        <label className="block text-sm font-semibold mb-2">Contact Address</label>
        <Textarea
          value={data.contact_address || ""}
          onChange={(e) => updateField(["contact_address"], e.target.value)}
          placeholder="Address"
          rows={3}
        />
      </div>
    );
  }

  return fields;
}

export default EditableSection;
