import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Eye, EyeOff, Layout, Settings, Clock, Activity,
  Heart, AlertCircle, Pill, TestTube, FileText
} from 'lucide-react';

interface FocusModePreferences {
  enabled: boolean;
  show_vitals_summary: boolean;
  show_recent_labs: boolean;
  show_active_medications: boolean;
  show_allergies: boolean;
  show_problem_list: boolean;
  show_billing_info: boolean;
}

export default function ClinicalFocusMode() {
  const [focusEnabled, setFocusEnabled] = useState(false);
  const [preferences, setPreferences] = useState<FocusModePreferences>({
    enabled: false,
    show_vitals_summary: true,
    show_recent_labs: true,
    show_active_medications: true,
    show_allergies: true,
    show_problem_list: true,
    show_billing_info: false
  });
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    if (sessionActive && focusEnabled) {
      // Track clicks in focus mode
      const handleClick = () => setClickCount(prev => prev + 1);
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [sessionActive, focusEnabled]);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('focus_mode_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // No preferences yet, use defaults
        return;
      }

      setPreferences({
        enabled: data.enabled,
        show_vitals_summary: data.show_vitals_summary,
        show_recent_labs: data.show_recent_labs,
        show_active_medications: data.show_active_medications,
        show_allergies: data.show_allergies,
        show_problem_list: data.show_problem_list,
        show_billing_info: data.show_billing_info
      });
      setFocusEnabled(data.enabled);
    } catch (error: any) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (newPrefs: Partial<FocusModePreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updated = { ...preferences, ...newPrefs };
      setPreferences(updated);

      // Determine user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from('focus_mode_preferences')
        .upsert({
          user_id: user.id,
          user_role: profile?.role || 'patient',
          ...updated
        });

      if (error) throw error;

      toast.success('Focus mode preferences saved');
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const toggleFocusMode = async (enabled: boolean) => {
    setFocusEnabled(enabled);
    await savePreferences({ enabled });
    
    if (enabled) {
      startFocusSession();
    } else {
      endFocusSession();
    }
  };

  const startFocusSession = async () => {
    setSessionActive(true);
    setSessionStart(new Date());
    setClickCount(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('focus_sessions')
      .insert({
        user_id: user.id,
        session_type: 'encounter',
        focus_enabled: true,
        active_panels: Object.keys(preferences).filter(k => 
          preferences[k as keyof FocusModePreferences] === true
        )
      });
  };

  const endFocusSession = async () => {
    if (!sessionStart) return;

    const duration = Math.floor((new Date().getTime() - sessionStart.getTime()) / 1000);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: session } = await supabase
      .from('focus_sessions')
      .select('id')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (session) {
      await supabase
        .from('focus_sessions')
        .update({
          ended_at: new Date().toISOString(),
          click_count: clickCount,
          time_in_session_seconds: duration
        })
        .eq('id', session.id);
    }

    setSessionActive(false);
    setSessionStart(null);
  };

  const panels = [
    { 
      key: 'show_vitals_summary' as const, 
      label: 'Vital Signs', 
      icon: Activity,
      description: 'Recent BP, HR, temp, SpO2'
    },
    { 
      key: 'show_active_medications' as const, 
      label: 'Active Medications', 
      icon: Pill,
      description: 'Current prescriptions and dosages'
    },
    { 
      key: 'show_allergies' as const, 
      label: 'Allergies', 
      icon: AlertCircle,
      description: 'Drug and environmental allergies'
    },
    { 
      key: 'show_recent_labs' as const, 
      label: 'Recent Labs', 
      icon: TestTube,
      description: 'Lab results from past 90 days'
    },
    { 
      key: 'show_problem_list' as const, 
      label: 'Problem List', 
      icon: Heart,
      description: 'Active diagnoses and conditions'
    },
    { 
      key: 'show_billing_info' as const, 
      label: 'Billing Information', 
      icon: FileText,
      description: 'Insurance and payment details'
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-6 w-6" />
              Clinical Focus Mode
            </h2>
            <p className="text-muted-foreground mt-1">
              Minimize distractions and surface only clinically relevant information
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="focus-toggle">Focus Mode</Label>
            <Switch
              id="focus-toggle"
              checked={focusEnabled}
              onCheckedChange={toggleFocusMode}
            />
          </div>
        </div>

        {sessionActive && (
          <div className="mb-6 p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">Session Active</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>
                  Duration: {sessionStart && Math.floor((new Date().getTime() - sessionStart.getTime()) / 60000)} min
                </span>
                <span>Clicks: {clickCount}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Layout className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Panel Visibility</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {panels.map(panel => {
              const Icon = panel.icon;
              const isVisible = preferences[panel.key];

              return (
                <Card 
                  key={panel.key}
                  className={`p-4 cursor-pointer transition-all ${
                    isVisible ? 'border-primary bg-primary/5' : 'opacity-60'
                  }`}
                  onClick={() => savePreferences({ [panel.key]: !isVisible })}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-1 ${isVisible ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{panel.label}</h4>
                          {isVisible ? (
                            <Badge variant="default" className="text-xs">Visible</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Hidden</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {panel.description}
                        </p>
                      </div>
                    </div>
                    {isVisible ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-2">
            <Settings className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium mb-1">How Focus Mode Works</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Hides administrative and billing fields during clinical encounters</li>
                <li>Surfaces problem-oriented clinical summaries with source links</li>
                <li>Reduces click burden with consistent, stable layouts</li>
                <li>Tracks efficiency metrics (clicks, time-in-note) for continuous improvement</li>
                <li>Prefetches external records and highlights deltas since last visit</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}