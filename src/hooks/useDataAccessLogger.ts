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

      // Use security_audit_log table for comprehensive audit trail
      await (supabase as any)
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          action: accessType,
          resource_type: resourceType,
          resource_id: resourceId,
          metadata: {
            purpose: purpose || `User accessed ${resourceType}`,
            timestamp: new Date().toISOString()
          },
          ip_address: null, // Would be set by edge function in production
          user_agent: navigator.userAgent,
          severity: accessType === 'delete' ? 'high' : 'low'
        });
    } catch (error) {
      console.error('Error logging security audit:', error);
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
