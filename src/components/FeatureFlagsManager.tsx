import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Flag, Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

export function FeatureFlagsManager() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFlag, setEditingFlag] = useState<any>(null);
  const [formData, setFormData] = useState({
    flag_name: '',
    description: '',
    enabled: false,
    rollout_percentage: 100,
    target_roles: [] as string[]
  });
  const { toast } = useToast();

  const loadFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlags(data || []);
    } catch (error: any) {
      console.error('Error loading feature flags:', error);
    }
  };

  const saveFlag = async () => {
    setLoading(true);
    try {
      if (editingFlag) {
        const { error } = await supabase
          .from('feature_flags')
          .update(formData)
          .eq('id', editingFlag.id);

        if (error) throw error;

        toast({
          title: "Flag Updated",
          description: "Feature flag has been updated successfully",
        });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
          .from('feature_flags')
          .insert({
            ...formData,
            created_by: user.id
          });

        if (error) throw error;

        toast({
          title: "Flag Created",
          description: "Feature flag has been created successfully",
        });
      }

      await loadFlags();
      setShowDialog(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving feature flag:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save feature flag",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flag: any) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled: !flag.enabled })
        .eq('id', flag.id);

      if (error) throw error;

      toast({
        title: flag.enabled ? "Flag Disabled" : "Flag Enabled",
        description: `${flag.name} has been ${flag.enabled ? 'disabled' : 'enabled'}`,
      });

      await loadFlags();
    } catch (error: any) {
      console.error('Error toggling flag:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to toggle flag",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      flag_name: '',
      description: '',
      enabled: false,
      rollout_percentage: 100,
      target_roles: []
    });
    setEditingFlag(null);
  };

  const openEditDialog = (flag: any) => {
    setEditingFlag(flag);
    setFormData({
      flag_name: flag.flag_name,
      description: flag.description || '',
      enabled: flag.enabled,
      rollout_percentage: flag.rollout_percentage || 100,
      target_roles: flag.target_roles || []
    });
    setShowDialog(true);
  };

  useEffect(() => {
    loadFlags();
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Feature Flags</h2>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Flag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFlag ? 'Edit' : 'Create'} Feature Flag</DialogTitle>
              <DialogDescription>
                Control feature rollout with feature flags
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="flag_name">Flag Name</Label>
                <Input
                  id="flag_name"
                  value={formData.flag_name}
                  onChange={(e) => setFormData({ ...formData, flag_name: e.target.value })}
                  placeholder="new_feature"
                  disabled={!!editingFlag}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Feature description"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enabled">Enabled</Label>
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Rollout Percentage: {formData.rollout_percentage}%</Label>
                <Slider
                  value={[formData.rollout_percentage]}
                  onValueChange={([value]) => setFormData({ ...formData, rollout_percentage: value })}
                  max={100}
                  step={10}
                />
              </div>

              <Button onClick={saveFlag} disabled={loading} className="w-full">
                {editingFlag ? 'Update' : 'Create'} Flag
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {flags.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No feature flags yet</p>
          </div>
        ) : (
          flags.map((flag) => (
            <div
              key={flag.id}
              className="p-4 border border-border rounded-lg flex items-center justify-between"
            >
              <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">{flag.flag_name}</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{flag.flag_name}</code>
                </div>
                {flag.description && (
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Rollout: {flag.rollout_percentage}%</span>
                  <span>Created: {new Date(flag.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={() => toggleFlag(flag)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(flag)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}