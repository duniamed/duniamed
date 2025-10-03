import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Shield, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function ComplianceRules() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    rule_name: "",
    rule_type: "",
    condition_description: "",
    action_description: "",
    priority: 0,
    is_active: true,
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clinics } = await supabase
        .from("clinics")
        .select("id")
        .eq("created_by", user.id);

      if (clinics && clinics.length > 0) {
        const { data } = await supabase
          .from("appointment_compliance_rules")
          .select("*")
          .eq("clinic_id", clinics[0].id)
          .order("priority", { ascending: false });

        setRules(data || []);
      }
    } catch (error) {
      console.error("Error loading rules:", error);
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

      const ruleData = {
        clinic_id: clinic.id,
        rule_name: formData.rule_name,
        rule_type: formData.rule_type,
        condition_criteria: { description: formData.condition_description },
        action_required: { description: formData.action_description },
        priority: formData.priority,
        is_active: formData.is_active,
      };

      if (editingRule) {
        await supabase
          .from("appointment_compliance_rules")
          .update(ruleData)
          .eq("id", editingRule.id);
        toast({ title: "Rule updated successfully" });
      } else {
        await supabase.from("appointment_compliance_rules").insert(ruleData);
        toast({ title: "Rule created successfully" });
      }

      setIsDialogOpen(false);
      setEditingRule(null);
      setFormData({
        rule_name: "",
        rule_type: "",
        condition_description: "",
        action_description: "",
        priority: 0,
        is_active: true,
      });
      loadRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      await supabase.from("appointment_compliance_rules").delete().eq("id", id);
      toast({ title: "Rule deleted successfully" });
      loadRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleRule = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from("appointment_compliance_rules")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      toast({ title: "Rule status updated" });
      loadRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Compliance Rules">
        <div className="flex items-center justify-center h-64">
          <p>Loading rules...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Compliance Rules">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Enforce clinical protocols and quality standards
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingRule(null);
                  setFormData({
                    rule_name: "",
                    rule_type: "",
                    condition_description: "",
                    action_description: "",
                    priority: 0,
                    is_active: true,
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? "Edit Rule" : "Create New Rule"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="rule_name">Rule Name</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) =>
                      setFormData({ ...formData, rule_name: e.target.value })
                    }
                    required
                    placeholder="e.g., A1C Test Required for Diabetic Patients"
                  />
                </div>

                <div>
                  <Label htmlFor="rule_type">Rule Type</Label>
                  <Select
                    value={formData.rule_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, rule_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre_appointment">Pre-Appointment</SelectItem>
                      <SelectItem value="scheduling">Scheduling</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="follow_up">Follow-Up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="condition">Condition / Trigger</Label>
                  <Textarea
                    id="condition"
                    value={formData.condition_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        condition_description: e.target.value,
                      })
                    }
                    placeholder="When should this rule apply? (e.g., All diabetic patients booking endocrinology appointments)"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="action">Required Action</Label>
                  <Textarea
                    id="action"
                    value={formData.action_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        action_description: e.target.value,
                      })
                    }
                    placeholder="What action is required? (e.g., Require A1C test within 6 months or automatically order lab work)"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority (0-10)</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: parseInt(e.target.value),
                        })
                      }
                      min="0"
                      max="10"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  {editingRule ? "Update" : "Create"} Rule
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={!rule.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span>{rule.rule_name}</span>
                    {rule.priority >= 7 && (
                      <Badge variant="destructive">High Priority</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => toggleRule(rule.id, rule.is_active)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  {rule.rule_type.replace("_", " ").toUpperCase()} • Priority: {rule.priority}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold mb-1">Condition:</p>
                    <p className="text-sm text-muted-foreground">
                      {rule.condition_criteria?.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">Required Action:</p>
                    <p className="text-sm text-muted-foreground">
                      {rule.action_required?.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {rules.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No compliance rules configured yet. Add rules to enforce clinical
                protocols and quality standards.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
