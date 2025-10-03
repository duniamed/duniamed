import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Clock, Stethoscope } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AppointmentTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    template_name: "",
    duration_minutes: 30,
    appointment_type: "",
    required_resources: [] as string[],
    required_equipment: [] as string[],
    preparation_instructions: "",
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clinics } = await supabase
        .from("clinics")
        .select("id")
        .eq("created_by", user.id);

      if (clinics && clinics.length > 0) {
        const { data } = await supabase
          .from("appointment_templates")
          .select("*")
          .eq("clinic_id", clinics[0].id)
          .eq("is_active", true)
          .order("template_name");

        setTemplates(data || []);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clinic } = await supabase
        .from("clinics")
        .select("id")
        .eq("created_by", user.id)
        .single();

      if (!clinic) throw new Error("No clinic found");

      const templateData = {
        ...formData,
        clinic_id: clinic.id,
        created_by: user.id,
        required_resources: JSON.stringify(formData.required_resources),
        required_equipment: JSON.stringify(formData.required_equipment),
      };

      if (editingTemplate) {
        await supabase
          .from("appointment_templates")
          .update(templateData)
          .eq("id", editingTemplate.id);
        toast({ title: "Template updated successfully" });
      } else {
        await supabase.from("appointment_templates").insert(templateData);
        toast({ title: "Template created successfully" });
      }

      setIsDialogOpen(false);
      setEditingTemplate(null);
      setFormData({
        template_name: "",
        duration_minutes: 30,
        appointment_type: "",
        required_resources: [],
        required_equipment: [],
        preparation_instructions: "",
      });
      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await supabase
        .from("appointment_templates")
        .update({ is_active: false })
        .eq("id", id);
      toast({ title: "Template deleted successfully" });
      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      duration_minutes: template.duration_minutes,
      appointment_type: template.appointment_type,
      required_resources: JSON.parse(template.required_resources || "[]"),
      required_equipment: JSON.parse(template.required_equipment || "[]"),
      preparation_instructions: template.preparation_instructions || "",
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout title="Appointment Templates">
        <div className="flex items-center justify-center h-64">
          <p>Loading templates...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Appointment Templates">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Standardize appointment types across your practice
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingTemplate(null);
                  setFormData({
                    template_name: "",
                    duration_minutes: 30,
                    appointment_type: "",
                    required_resources: [],
                    required_equipment: [],
                    preparation_instructions: "",
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Edit Template" : "Create New Template"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template_name">Template Name</Label>
                    <Input
                      id="template_name"
                      value={formData.template_name}
                      onChange={(e) =>
                        setFormData({ ...formData, template_name: e.target.value })
                      }
                      required
                      placeholder="e.g., Standard Physical Exam"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_minutes: parseInt(e.target.value),
                        })
                      }
                      required
                      min="15"
                      step="15"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="appointment_type">Appointment Type</Label>
                  <Input
                    id="appointment_type"
                    value={formData.appointment_type}
                    onChange={(e) =>
                      setFormData({ ...formData, appointment_type: e.target.value })
                    }
                    required
                    placeholder="e.g., Consultation, Follow-up, Procedure"
                  />
                </div>

                <div>
                  <Label htmlFor="preparation_instructions">
                    Preparation Instructions
                  </Label>
                  <Textarea
                    id="preparation_instructions"
                    value={formData.preparation_instructions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preparation_instructions: e.target.value,
                      })
                    }
                    placeholder="Instructions for patients before the appointment"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Required Resources (comma-separated)</Label>
                  <Input
                    value={formData.required_resources.join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        required_resources: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g., Exam Room, Procedure Room"
                  />
                </div>

                <div>
                  <Label>Required Equipment (comma-separated)</Label>
                  <Input
                    value={formData.required_equipment.join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        required_equipment: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g., EKG Machine, Ultrasound"
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingTemplate ? "Update" : "Create"} Template
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    <span className="text-base">{template.template_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{template.appointment_type}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{template.duration_minutes} minutes</span>
                  </div>
                  {template.required_resources &&
                    JSON.parse(template.required_resources).length > 0 && (
                      <div>
                        <span className="font-semibold">Resources:</span>{" "}
                        {JSON.parse(template.required_resources).join(", ")}
                      </div>
                    )}
                  {template.required_equipment &&
                    JSON.parse(template.required_equipment).length > 0 && (
                      <div>
                        <span className="font-semibold">Equipment:</span>{" "}
                        {JSON.parse(template.required_equipment).join(", ")}
                      </div>
                    )}
                  {template.preparation_instructions && (
                    <div className="pt-2 border-t">
                      <span className="font-semibold">Prep Instructions:</span>
                      <p className="text-muted-foreground mt-1">
                        {template.preparation_instructions}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {templates.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                No appointment templates yet. Create your first template to standardize
                scheduling across your practice.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
