import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Globe } from 'lucide-react';

/**
 * C13 CROSS-BORDER - Locale Selector
 * Allows users to set language, timezone, currency preferences
 */

export function LocaleSelector() {
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_locale_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setLanguage(data.preferred_language);
        setCurrency(data.currency);
      }
    } catch (error) {
      console.error('Error loading locale preferences:', error);
    }
  };

  const updatePreference = async (field: string, value: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_locale_preferences')
        .upsert({
          user_id: user.id,
          [field]: value
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Preferences updated",
        description: "Your locale preferences have been saved"
      });
    } catch (error: any) {
      toast({
        title: "Error updating preferences",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Localization</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Language</label>
          <Select 
            value={language} 
            onValueChange={(value) => {
              setLanguage(value);
              updatePreference('preferred_language', value);
            }}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Currency</label>
          <Select 
            value={currency} 
            onValueChange={(value) => {
              setCurrency(value);
              updatePreference('currency', value);
            }}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="JPY">JPY (¥)</SelectItem>
              <SelectItem value="CAD">CAD ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}