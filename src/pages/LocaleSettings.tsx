import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe, DollarSign, Calendar, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

const timeFormats = [
  { value: '12h', label: '12-hour (AM/PM)' },
  { value: '24h', label: '24-hour' },
];

const timezones = [
  'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 
  'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'
];

export default function LocaleSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    preferred_language: 'en',
    preferred_currency: 'USD',
    date_format: 'MM/DD/YYYY',
    time_format: '12h',
    timezone: 'UTC',
    rtl_enabled: false,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_locale_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPreferences({
          preferred_language: data.preferred_language,
          preferred_currency: data.currency || 'USD',
          date_format: data.date_format,
          time_format: '12h',
          timezone: data.timezone,
          rtl_enabled: false,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_locale_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error) throw error;

      toast({
        title: "Preferences Saved",
        description: "Your localization settings have been updated.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            Localization Settings
            <InfoTooltip content="Customize how dates, times, currency, and language appear throughout your experience. Changes apply to all your sessions and devices." />
          </h1>
          <p className="text-muted-foreground mt-2">
            Personalize your regional and language preferences for a tailored experience.
          </p>
        </div>

        <div className="space-y-6">
          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language
                <InfoTooltip content="Select your preferred language. Interface text and key communications will be translated automatically." />
              </CardTitle>
              <CardDescription>
                Choose your preferred language for the interface and communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={preferences.preferred_language}
                onValueChange={(value) => setPreferences({ ...preferences, preferred_language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Currency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Currency
                <InfoTooltip content="Set your local currency. All prices will be displayed in your chosen currency with conversion rates applied." />
              </CardTitle>
              <CardDescription>
                Select your preferred currency for pricing and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={preferences.preferred_currency}
                onValueChange={(value) => setPreferences({ ...preferences, preferred_currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Date & Time Formats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date & Time Formats
                <InfoTooltip content="Choose how dates and times are displayed. This ensures appointments and schedules match your local conventions." />
              </CardTitle>
              <CardDescription>
                Customize how dates and times are displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Date Format</Label>
                <Select 
                  value={preferences.date_format}
                  onValueChange={(value) => setPreferences({ ...preferences, date_format: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Time Format</Label>
                <Select 
                  value={preferences.time_format}
                  onValueChange={(value) => setPreferences({ ...preferences, time_format: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Timezone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timezone
                <InfoTooltip content="Set your timezone for accurate appointment scheduling. Specialists in different timezones will see correct local times." />
              </CardTitle>
              <CardDescription>
                Set your timezone for accurate scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={preferences.timezone}
                onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* RTL Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Right-to-Left (RTL) Layout
                <InfoTooltip content="Enable RTL layout for languages like Arabic and Hebrew. The interface will mirror to support right-to-left reading." />
              </CardTitle>
              <CardDescription>
                Enable for languages that read right-to-left
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="rtl">Enable RTL Layout</Label>
                <Switch
                  id="rtl"
                  checked={preferences.rtl_enabled}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, rtl_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={savePreferences} 
            disabled={saving}
            className="w-full"
            size="lg"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
