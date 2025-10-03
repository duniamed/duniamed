import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useFormAutosave<T>(
  formType: string,
  formData: T,
  enabled: boolean = true
) {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(formData);
    
    // Skip if data hasn't changed
    if (currentData === lastSavedRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce autosave by 2 seconds
    timeoutRef.current = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if autosave exists
        const { data: existing } = await supabase
          .from('form_autosaves')
          .select('id')
          .eq('user_id', user.id)
          .eq('form_type', formType)
          .single();

        if (existing) {
          // Update existing
          await supabase
            .from('form_autosaves')
            .update({ form_data: formData as any })
            .eq('id', existing.id);
        } else {
          // Create new
          await supabase
            .from('form_autosaves')
            .insert({
              user_id: user.id,
              form_type: formType,
              form_data: formData as any
            });
        }

        lastSavedRef.current = currentData;
        
        // Silent save - only show toast on first save
        if (!lastSavedRef.current) {
          toast({
            title: "Draft saved",
            description: "Your progress has been automatically saved",
          });
        }
      } catch (error) {
        console.error('Autosave error:', error);
      }
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, formType, enabled, toast]);
}

export async function loadAutosave<T>(formType: string): Promise<T | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('form_autosaves')
      .select('form_data')
      .eq('user_id', user.id)
      .eq('form_type', formType)
      .single();

    if (error || !data) return null;

    return data.form_data as T;
  } catch (error) {
    console.error('Load autosave error:', error);
    return null;
  }
}

export async function clearAutosave(formType: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('form_autosaves')
      .delete()
      .eq('user_id', user.id)
      .eq('form_type', formType);
  } catch (error) {
    console.error('Clear autosave error:', error);
  }
}
