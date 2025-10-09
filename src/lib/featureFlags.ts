import { supabase } from '@/integrations/supabase/client';

let flagsCache: Map<string, boolean> | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function isFeatureEnabled(key: string): Promise<boolean> {
  try {
    // Check cache
    const now = Date.now();
    if (flagsCache && now < cacheExpiry) {
      return flagsCache.get(key) || false;
    }

    // Fetch fresh flags
    const { data: flags, error } = await supabase
      .from('feature_flags')
      .select('flag_name, enabled, rollout_percentage, target_roles')
      .eq('enabled', true);

    if (error) throw error;

    // Rebuild cache
    flagsCache = new Map();
    cacheExpiry = now + CACHE_DURATION;

    if (!flags || flags.length === 0) {
      return false;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    for (const flag of flags) {
      let enabled = flag.enabled;

      // Check rollout percentage
      if (flag.rollout_percentage && flag.rollout_percentage < 100) {
        const userHash = user?.id ? hashString(user.id) : Math.random();
        enabled = enabled && (userHash % 100) < flag.rollout_percentage;
      }

      // Check target roles
      if (flag.target_roles && flag.target_roles.length > 0 && user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        const userRoles = roles?.map(r => r.role as string) || [];
        enabled = enabled && flag.target_roles.some((targetRole: string) => 
          userRoles.includes(targetRole)
        );
      }

      flagsCache.set(flag.flag_name, enabled);
    }

    return flagsCache.get(key) || false;
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return false;
  }
}

// Simple hash function for user ID
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function clearFlagsCache() {
  flagsCache = null;
  cacheExpiry = 0;
}