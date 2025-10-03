import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Accessibility, Volume2, Eye, Type, Zap } from 'lucide-react';

export default function AccessibilitySettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    accessibility_mode: false,
    voice_assist_enabled: false,
    font_size: 'medium',
    high_contrast: false,
    screen_reader_optimized: false,
    reduced_motion: false,
    ui_mode: 'full'
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences({
          accessibility_mode: data.accessibility_mode,
          voice_assist_enabled: data.voice_assist_enabled,
          font_size: data.font_size,
          high_contrast: data.high_contrast,
          screen_reader_optimized: data.screen_reader_optimized,
          reduced_motion: data.reduced_motion,
          ui_mode: data.ui_mode
        });
      }
    } catch (error: any) {
      toast({
        title: "Error loading preferences",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your accessibility preferences have been updated",
      });

      // Apply changes to document
      applyPreferences();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const applyPreferences = () => {
    const root = document.documentElement;
    
    // Font size
    const fontSizeMap = { small: '14px', medium: '16px', large: '18px', xl: '20px' };
    root.style.fontSize = fontSizeMap[preferences.font_size as keyof typeof fontSizeMap];
    
    // High contrast
    if (preferences.high_contrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (preferences.reduced_motion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  };

  if (loading) {
    return <Layout><div className="p-8">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Accessibility className="h-8 w-8" />
            Accessibility Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Customize your experience to match your needs and preferences
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visual Preferences
              </CardTitle>
              <CardDescription>Adjust how content is displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Accessibility Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enhanced contrast and larger interactive elements
                  </p>
                </div>
                <Switch
                  checked={preferences.accessibility_mode}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, accessibility_mode: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>High Contrast</Label>
                  <p className="text-sm text-muted-foreground">
                    Stronger color contrast for better visibility
                  </p>
                </div>
                <Switch
                  checked={preferences.high_contrast}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, high_contrast: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Font Size
                </Label>
                <Select
                  value={preferences.font_size}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, font_size: value })
                  }
                >
                  <SelectTrigger id="font-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium (Default)</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Motion & Interaction
              </CardTitle>
              <CardDescription>Control animations and interactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimize animations and transitions
                  </p>
                </div>
                <Switch
                  checked={preferences.reduced_motion}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, reduced_motion: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ui-mode">Interface Complexity</Label>
                <Select
                  value={preferences.ui_mode}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, ui_mode: value })
                  }
                >
                  <SelectTrigger id="ui-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simplified">Simplified - Essential features only</SelectItem>
                    <SelectItem value="basic">Basic - Reduced complexity</SelectItem>
                    <SelectItem value="full">Full - All features</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Assistive Features
              </CardTitle>
              <CardDescription>Tools to enhance usability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Voice Assist</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable voice commands and audio feedback
                  </p>
                </div>
                <Switch
                  checked={preferences.voice_assist_enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, voice_assist_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Screen Reader Optimization</Label>
                  <p className="text-sm text-muted-foreground">
                    Optimize interface for screen readers
                  </p>
                </div>
                <Switch
                  checked={preferences.screen_reader_optimized}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, screen_reader_optimized: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
