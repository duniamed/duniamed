import { supabase } from '@/integrations/supabase/client';

export const useActivity = () => {
  const logActivity = async (
    action: string,
    targetType?: string,
    targetId?: string,
    metadata?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('activities').insert({
        user_id: user.id,
        action,
        target_type: targetType,
        target_id: targetId,
        metadata: metadata || {},
      });

      if (error) {
        console.error('Failed to log activity:', error);
      }
    } catch (error) {
      console.error('Activity logging error:', error);
    }
  };

  return { logActivity };
};
