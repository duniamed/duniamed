import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ClinicResourceManagement() {
  const [resources, setResources] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    resource_type: "",
    resource_name: "",
    location_id: "",
    capacity: 1,
    properties: {},
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's clinics
      const { data: clinics } = await supabase
        .from("clinics")
        .select("id")
        .eq("created_by", user.id);

      if (clinics && clinics.length > 0) {
        const clinicId = clinics[0].id;

        // Load locations
        const { data: locs } = await supabase
          .from("clinic_locations")
          .select("*")
          .eq("clinic_id", clinicId);
        setLocations(locs || []);

        // Load resources
        const { data: res } = await supabase
          .from("clinic_resources")
          .select("*, clinic_locations(location_name)")
          .eq("clinic_id", clinicId)
          .order("created_at", { ascending: false });
        setResources(res || []);
      }
    } catch (error) {
      console.error("Error loading resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clinics } = await supabase
        .from("clinics")
        .select("id")
        .eq("created_by", user.id)
        .single();

      if (!clinics) throw new Error("No clinic found");

      if (editingResource) {
        await supabase
          .from("clinic_resources")
          .update(formData)
          .eq("id", editingResource.id);
        toast({ title: "Resource updated successfully" });
      } else {
        await supabase
          .from("clinic_resources")
          .insert({
            ...formData,
            clinic_id: clinics.id,
          });
        toast({ title: "Resource added successfully" });
      }

      setIsDialogOpen(false);
      setEditingResource(null);
      setFormData({
        resource_type: "",
        resource_name: "",
        location_id: "",
        capacity: 1,
        properties: {},
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      await supabase.from("clinic_resources").delete().eq("id", id);
      toast({ title: "Resource deleted successfully" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (resource: any) => {
    setEditingResource(resource);
    setFormData({
      resource_type: resource.resource_type,
      resource_name: resource.resource_name,
      location_id: resource.location_id || "",
      capacity: resource.capacity,
      properties: resource.properties || {},
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout title="Resource Management">
        <div className="flex items-center justify-center h-64">
          <p>Loading resources...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Resource Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Manage clinic resources for constraint-based scheduling
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingResource(null);
                setFormData({
                  resource_type: "",
                  resource_name: "",
                  location_id: "",
                  capacity: 1,
                  properties: {},
                });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingResource ? "Edit Resource" : "Add New Resource"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="resource_type">Resource Type</Label>
                  <Select
                    value={formData.resource_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, resource_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exam_room">Exam Room</SelectItem>
                      <SelectItem value="procedure_room">Procedure Room</SelectItem>
                      <SelectItem value="mri_machine">MRI Machine</SelectItem>
                      <SelectItem value="ct_scanner">CT Scanner</SelectItem>
                      <SelectItem value="ultrasound">Ultrasound</SelectItem>
                      <SelectItem value="xray">X-Ray</SelectItem>
                      <SelectItem value="lab">Laboratory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="resource_name">Resource Name</Label>
                  <Input
                    id="resource_name"
                    value={formData.resource_name}
                    onChange={(e) =>
                      setFormData({ ...formData, resource_name: e.target.value })
                    }
                    required
                    placeholder="e.g., Exam Room 1, MRI Suite A"
                  />
                </div>

                <div>
                  <Label htmlFor="location_id">Location</Label>
                  <Select
                    value={formData.location_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, location_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) })
                    }
                    min="1"
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingResource ? "Update" : "Add"} Resource
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{resource.resource_name}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(resource)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(resource.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  {resource.resource_type.replace("_", " ").toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Location:</span>{" "}
                    {resource.clinic_locations?.location_name || "Not specified"}
                  </div>
                  <div>
                    <span className="font-semibold">Capacity:</span> {resource.capacity}
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span>{" "}
                    <span className={resource.is_active ? "text-green-600" : "text-red-600"}>
                      {resource.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {resources.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                No resources configured yet. Add your first resource to enable advanced
                scheduling features.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
