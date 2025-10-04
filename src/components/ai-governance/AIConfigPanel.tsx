import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, CheckCircle, XCircle, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

type AIContext = 'patient' | 'clinic' | 'internal' | 'specialist';

interface AIConfig {
  id: string;
  name: string;
  context: AIContext;
  responsiveness: {
    tone: string;
    verbosity: string;
    abstain_policy: string;
  };
  compliance_layers: Record<string, boolean>;
  data_access_scope: {
    source_whitelist: string[];
    pii_masking: boolean;
  };
  version: number;
  is_active: boolean;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
}

export function AIConfigPanel() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['aiConfigs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_config_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any as AIConfig[];
    }
  });

  const createConfigMutation = useMutation({
    mutationFn: async (newConfig: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_config_profiles')
        .insert({
          ...newConfig,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiConfigs'] });
      toast.success('AI configuration created successfully');
      setIsDialogOpen(false);
      setEditingConfig(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create configuration: ${error.message}`);
    }
  });

  const approveConfigMutation = useMutation({
    mutationFn: async (configId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Deactivate all other configs for same context first
      const config = configs?.find(c => c.id === configId);
      if (config) {
        await supabase
          .from('ai_config_profiles')
          .update({ is_active: false })
          .eq('context', config.context);
      }

      // Activate and approve this one
      const { error } = await supabase
        .from('ai_config_profiles')
        .update({
          is_active: true,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', configId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiConfigs'] });
      toast.success('Configuration approved and activated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    }
  });

  if (isLoading) {
    return <div>Loading configurations...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {configs?.length || 0} configuration(s)
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingConfig(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Edit' : 'Create'} AI Configuration
              </DialogTitle>
              <DialogDescription>
                Configure AI behavior for a specific context (patient, clinic, specialist, internal)
              </DialogDescription>
            </DialogHeader>
            <ConfigForm
              config={editingConfig}
              onSubmit={(data) => createConfigMutation.mutate(data)}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingConfig(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {configs?.map((config) => (
          <div
            key={config.id}
            className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{config.name}</h3>
                  {config.is_active && (
                    <Badge variant="default">Active</Badge>
                  )}
                  {config.approved_by && (
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Context: {config.context} • Version: {config.version}
                </div>
              </div>
              <div className="flex gap-2">
                {!config.is_active && (
                  <Button
                    size="sm"
                    onClick={() => approveConfigMutation.mutate(config.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve & Activate
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingConfig(config);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium mb-1">Responsiveness</div>
                <div className="text-muted-foreground space-y-0.5">
                  <div>Tone: {config.responsiveness.tone}</div>
                  <div>Verbosity: {config.responsiveness.verbosity}</div>
                  <div>Abstain Policy: {config.responsiveness.abstain_policy}</div>
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">Compliance</div>
                <div className="text-muted-foreground space-y-0.5">
                  {Object.entries(config.compliance_layers).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1">
                      {value ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigForm({ config, onSubmit, onCancel }: {
  config: AIConfig | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: config?.name || '',
    context: config?.context || 'patient' as AIContext,
    tone: config?.responsiveness.tone || 'empathetic',
    verbosity: config?.responsiveness.verbosity || 'balanced',
    abstain_policy: config?.responsiveness.abstain_policy || 'strict',
    hipaa: config?.compliance_layers.HIPAA ?? true,
    lgpd: config?.compliance_layers.LGPD ?? true,
    gdpr: config?.compliance_layers.GDPR ?? true,
    pii_masking: config?.data_access_scope.pii_masking ?? true,
    change_note: ''
  });

  const handleSubmit = () => {
    onSubmit({
      name: formData.name,
      context: formData.context,
      responsiveness: {
        tone: formData.tone,
        verbosity: formData.verbosity,
        abstain_policy: formData.abstain_policy
      },
      compliance_layers: {
        HIPAA: formData.hipaa,
        LGPD: formData.lgpd,
        GDPR: formData.gdpr
      },
      data_access_scope: {
        source_whitelist: [],
        pii_masking: formData.pii_masking
      },
      change_note: formData.change_note
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Configuration Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Patient Triage Config"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="context">Context</Label>
        <Select value={formData.context} onValueChange={(value) => setFormData({ ...formData, context: value as AIContext })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="patient">Patient</SelectItem>
            <SelectItem value="clinic">Clinic</SelectItem>
            <SelectItem value="specialist">Specialist</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tone</Label>
        <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="empathetic">Empathetic</SelectItem>
            <SelectItem value="precise">Precise</SelectItem>
            <SelectItem value="concise">Concise</SelectItem>
            <SelectItem value="assertive">Assertive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Verbosity</Label>
        <Select value={formData.verbosity} onValueChange={(value) => setFormData({ ...formData, verbosity: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="balanced">Balanced</SelectItem>
            <SelectItem value="detailed">Detailed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Abstain Policy</Label>
        <Select value={formData.abstain_policy} onValueChange={(value) => setFormData({ ...formData, abstain_policy: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="strict">Strict (abstain when uncertain)</SelectItem>
            <SelectItem value="moderate">Moderate (escalate uncertainties)</SelectItem>
            <SelectItem value="permissive">Permissive (provide best-effort)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Compliance Layers</Label>
        <div className="flex items-center justify-between">
          <span className="text-sm">HIPAA Compliance</span>
          <Switch checked={formData.hipaa} onCheckedChange={(checked) => setFormData({ ...formData, hipaa: checked })} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">LGPD Compliance</span>
          <Switch checked={formData.lgpd} onCheckedChange={(checked) => setFormData({ ...formData, lgpd: checked })} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">GDPR Compliance</span>
          <Switch checked={formData.gdpr} onCheckedChange={(checked) => setFormData({ ...formData, gdpr: checked })} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">PII Masking</span>
          <Switch checked={formData.pii_masking} onCheckedChange={(checked) => setFormData({ ...formData, pii_masking: checked })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="change_note">Change Note</Label>
        <Textarea
          id="change_note"
          value={formData.change_note}
          onChange={(e) => setFormData({ ...formData, change_note: e.target.value })}
          placeholder="Describe the purpose of this configuration..."
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {config ? 'Update' : 'Create'} Configuration
        </Button>
      </DialogFooter>
    </div>
  );
}
