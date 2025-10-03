import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * C15 PRIVACY - Data Access Logger Hook
 * Automatically logs all data access operations for audit trails
 */

interface LogAccessOptions {
  resourceType: string;
  resourceId?: string;
  accessType: 'read' | 'write' | 'update' | 'delete' | 'share';
  purpose?: string;
}

export function useDataAccessLogger() {
  const logAccess = async ({
    resourceType,
    resourceId,
    accessType,
    purpose
  }: LogAccessOptions) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as any)
        .from('data_access_logs')
        .insert({
          user_id: user.id,
          accessor_id: user.id,
          resource_type: resourceType,
          resource_id: resourceId,
          access_type: accessType,
          purpose: purpose || `User accessed ${resourceType}`,
          ip_address: null, // Would be set by backend in production
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Error logging data access:', error);
    }
  };

  return { logAccess };
}

/**
 * Hook to automatically log data access when component mounts
 */
export function useAutoLogAccess(options: LogAccessOptions) {
  const { logAccess } = useDataAccessLogger();

  useEffect(() => {
    logAccess(options);
  }, [options.resourceType, options.resourceId]);
}
