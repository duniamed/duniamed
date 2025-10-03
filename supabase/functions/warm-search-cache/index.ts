import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateSearchKey(filters: any): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(filters));
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      specialty, 
      language, 
      condition,
      timezone,
      consultation_type,
      min_fee,
      max_fee,
      accepts_insurance,
      verified_only,
      cache_duration_hours = 4
    } = await req.json();

    // Generate cache key from search parameters
    const filters = {
      specialty,
      language,
      condition,
      timezone,
      consultation_type,
      min_fee,
      max_fee,
      accepts_insurance,
      verified_only
    };

    const searchKey = await generateSearchKey(filters);

    console.log('Search cache key:', searchKey);

    // Check if cache exists and is valid
    const { data: cached } = await supabase
      .from('specialist_search_cache')
      .select('*')
      .eq('search_key', searchKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      // Update hit count
      await supabase
        .from('specialist_search_cache')
        .update({ hit_count: cached.hit_count + 1 })
        .eq('id', cached.id);

      console.log('Cache hit:', cached.id);

      return new Response(JSON.stringify({
        success: true,
        source: 'cache',
        specialist_ids: cached.specialist_ids,
        result_count: cached.result_count,
        cached_at: cached.cached_at
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cache miss - perform search
    console.log('Cache miss, performing search');

    let query = supabase
      .from('specialists')
      .select('id')
      .eq('is_accepting_patients', true);

    if (verified_only) {
      query = query.eq('verification_status', 'verified');
    } else {
      query = query.in('verification_status', ['verified', 'pending']);
    }

    if (specialty && specialty !== 'all') {
      query = query.contains('specialty', [specialty]);
    }

    if (language && language !== 'all') {
      query = query.contains('languages', [language]);
    }

    if (condition && condition !== 'all') {
      query = query.contains('conditions_treated', [condition]);
    }

    if (timezone && timezone !== 'all') {
      const tz = timezone.split(' ')[0];
      query = query.eq('timezone', tz);
    }

    if (min_fee) {
      query = query.gte('consultation_fee_min', parseFloat(min_fee));
    }

    if (max_fee) {
      query = query.lte('consultation_fee_max', parseFloat(max_fee));
    }

    if (accepts_insurance) {
      query = query.eq('accepts_insurance', true);
    }

    if (consultation_type === 'video') {
      query = query.eq('video_consultation_enabled', true);
    } else if (consultation_type === 'in-person') {
      query = query.eq('in_person_enabled', true);
    }

    const { data: specialists, error: searchError } = await query;

    if (searchError) throw searchError;

    const specialistIds = specialists?.map(s => s.id) || [];

    // Store in cache
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + cache_duration_hours);

    const { data: cacheEntry, error: cacheError } = await supabase
      .from('specialist_search_cache')
      .insert({
        search_key: searchKey,
        search_filters: filters,
        specialist_ids: specialistIds,
        result_count: specialistIds.length,
        cached_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        hit_count: 0
      })
      .select()
      .single();

    if (cacheError) {
      console.error('Cache storage failed:', cacheError);
    } else {
      console.log('Results cached:', cacheEntry.id);
    }

    return new Response(JSON.stringify({
      success: true,
      source: 'database',
      specialist_ids: specialistIds,
      result_count: specialistIds.length,
      cached_at: new Date().toISOString(),
      cache_id: cacheEntry?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in warm-search-cache:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});