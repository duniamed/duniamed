// UNLIMITED EDGE FUNCTION CAPACITIES: Admin Feature Management Dashboard
// Core Principles: Voice AI, No typing, Auto-suggestions, ID-based architecture

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Mic, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';

interface FeatureFlag {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string;
  is_enabled: boolean;
  access_level: 'free' | 'basic' | 'premium' | 'enterprise' | 'custom';
  allowed_roles: string[];
  config: Record<string, any>;
}

export default function AdminFeatureManagement() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { isListening, startListening, stopListening } = useVoiceCommand({
    onCommand: handleVoiceCommand
  });

  useEffect(() => {
    loadFeatures();
  }, []);

  async function loadFeatures() {
    try {
      const { data, error } = await (supabase as any)
        .from('admin_feature_flags')
        .select('*')
        .order('feature_name');

      if (error) throw error;
      setFeatures((data || []) as FeatureFlag[]);
    } catch (error) {
      console.error('Error loading features:', error);
      toast.error('Failed to load features');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeature(id: string, currentState: boolean) {
    setSaving(id);
    try {
      const { error } = await (supabase as any)
        .from('admin_feature_flags')
        .update({ 
          is_enabled: !currentState,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setFeatures(prev => prev.map(f => 
        f.id === id ? { ...f, is_enabled: !currentState } : f
      ));

      toast.success(`Feature ${!currentState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling feature:', error);
      toast.error('Failed to update feature');
    } finally {
      setSaving(null);
    }
  }

  async function updateAccessLevel(id: string, level: FeatureFlag['access_level']) {
    try {
      const { error } = await (supabase as any)
        .from('admin_feature_flags')
        .update({ access_level: level })
        .eq('id', id);

      if (error) throw error;

      setFeatures(prev => prev.map(f => 
        f.id === id ? { ...f, access_level: level } : f
      ));

      toast.success('Access level updated');
    } catch (error) {
      console.error('Error updating access level:', error);
      toast.error('Failed to update access level');
    }
  }

  async function updateAllowedRoles(id: string, roles: string[]) {
    try {
      const { error } = await (supabase as any)
        .from('admin_feature_flags')
        .update({ allowed_roles: roles })
        .eq('id', id);

      if (error) throw error;

      setFeatures(prev => prev.map(f => 
        f.id === id ? { ...f, allowed_roles: roles } : f
      ));

      toast.success('Allowed roles updated');
    } catch (error) {
      console.error('Error updating roles:', error);
      toast.error('Failed to update roles');
    }
  }

  function handleVoiceCommand(command: string) {
    // AI-powered voice command parsing (no typing required)
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('enable') || lowerCommand.includes('activate')) {
      const featureName = extractFeatureName(command);
      const feature = features.find(f => 
        f.feature_name.toLowerCase().includes(featureName.toLowerCase())
      );
      if (feature && !feature.is_enabled) {
        toggleFeature(feature.id, feature.is_enabled);
        toast.success(`Enabling ${feature.feature_name}`);
      }
    } else if (lowerCommand.includes('disable') || lowerCommand.includes('deactivate')) {
      const featureName = extractFeatureName(command);
      const feature = features.find(f => 
        f.feature_name.toLowerCase().includes(featureName.toLowerCase())
      );
      if (feature && feature.is_enabled) {
        toggleFeature(feature.id, feature.is_enabled);
        toast.success(`Disabling ${feature.feature_name}`);
      }
    }
  }

  function extractFeatureName(command: string): string {
    // Simple extraction - in production, use NLP
    const words = command.toLowerCase().split(' ');
    const actionWords = ['enable', 'disable', 'activate', 'deactivate', 'turn', 'on', 'off'];
    return words.filter(w => !actionWords.includes(w)).join(' ');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Management</h1>
          <p className="text-muted-foreground">
            Manage platform features with voice commands or manual controls
          </p>
        </div>
        <Button
          onClick={isListening ? stopListening : startListening}
          variant={isListening ? 'destructive' : 'default'}
          size="lg"
        >
          <Mic className={`w-4 h-4 mr-2 ${isListening ? 'animate-pulse' : ''}`} />
          {isListening ? 'Stop Voice' : 'Voice Commands'}
        </Button>
      </div>

      <div className="grid gap-4">
        {features.map((feature) => (
          <Card key={feature.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{feature.feature_name}</h3>
                  <Badge variant={feature.is_enabled ? 'default' : 'secondary'}>
                    {feature.is_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Badge variant="outline">{feature.access_level}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {feature.description}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {feature.allowed_roles.map(role => (
                    <Badge key={role} variant="secondary">{role}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={feature.is_enabled}
                  onCheckedChange={() => toggleFeature(feature.id, feature.is_enabled)}
                  disabled={saving === feature.id}
                />
                {saving === feature.id && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex gap-2">
                <select
                  value={feature.access_level}
                  onChange={(e) => updateAccessLevel(feature.id, e.target.value as any)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}