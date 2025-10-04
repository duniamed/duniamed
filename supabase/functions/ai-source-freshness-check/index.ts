import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Running source freshness check...');

    // Get all approved sources
    const { data: sources, error: sourcesError } = await supabase
      .from('ai_source_registry')
      .select('*')
      .eq('status', 'approved');

    if (sourcesError) {
      throw sourcesError;
    }

    const results = [];
    const staleThresholdDays = 30;
    const now = new Date();

    for (const source of sources || []) {
      try {
        // Check if source is accessible
        const response = await fetch(source.uri, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });

        const isAccessible = response.ok;
        const lastChecked = new Date(source.updated_at);
        const daysSinceUpdate = Math.floor((now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60 * 24));
        const isStale = daysSinceUpdate > staleThresholdDays;

        // Calculate new checksum for content-based sources
        let checksumChanged = false;
        if (source.source_type !== 'api' && isAccessible) {
          try {
            const content = await fetch(source.uri, { signal: AbortSignal.timeout(10000) });
            if (content.ok) {
              const text = await content.text();
              const newChecksum = simpleHash(text);
              checksumChanged = newChecksum !== source.checksum;

              if (checksumChanged) {
                // Update checksum and set to pending review
                await supabase
                  .from('ai_source_registry')
                  .update({
                    checksum: newChecksum,
                    status: 'pending',
                    metadata: {
                      ...source.metadata,
                      last_change_detected: now.toISOString(),
                      previous_checksum: source.checksum,
                    },
                  })
                  .eq('id', source.id);
              }
            }
          } catch (error) {
            console.error(`Failed to fetch content for ${source.name}:`, error);
          }
        }

        results.push({
          source_id: source.id,
          source_key: source.source_key,
          name: source.name,
          accessible: isAccessible,
          stale: isStale,
          days_since_update: daysSinceUpdate,
          checksum_changed: checksumChanged,
          status: isAccessible ? (isStale ? 'stale' : 'fresh') : 'inaccessible',
        });

        // Update metadata with last check
        await supabase
          .from('ai_source_registry')
          .update({
            metadata: {
              ...source.metadata,
              last_freshness_check: now.toISOString(),
              last_check_status: isAccessible ? 'accessible' : 'inaccessible',
            },
          })
          .eq('id', source.id);

      } catch (error) {
        console.error(`Error checking source ${source.name}:`, error);
        results.push({
          source_id: source.id,
          source_key: source.source_key,
          name: source.name,
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
        });
      }
    }

    const summary = {
      total_sources: sources?.length || 0,
      accessible: results.filter(r => r.accessible).length,
      stale: results.filter(r => r.stale).length,
      changed: results.filter(r => r.checksum_changed).length,
      errors: results.filter(r => r.status === 'error').length,
      timestamp: now.toISOString(),
    };

    console.log('Freshness check complete:', summary);

    return new Response(JSON.stringify({ summary, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Freshness check error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 10000); i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `v${Math.abs(hash)}`;
}
