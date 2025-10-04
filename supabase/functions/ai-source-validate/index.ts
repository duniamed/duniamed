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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Verify admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    const { sourceKey, uri, sourceType } = await req.json();

    // Validate source accessibility
    const validation = await validateSource(uri, sourceType);

    if (!validation.accessible) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Source not accessible',
          details: validation.error 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate checksum for versioning
    const checksum = await calculateChecksum(uri, sourceType);

    // Check if source already exists
    const { data: existing } = await supabase
      .from('ai_source_registry')
      .select('*')
      .eq('source_key', sourceKey)
      .single();

    if (existing) {
      // Update if checksum changed
      if (existing.checksum !== checksum) {
        await supabase
          .from('ai_source_registry')
          .update({
            checksum,
            version: incrementVersion(existing.version),
            status: 'pending',
          })
          .eq('source_key', sourceKey);

        return new Response(
          JSON.stringify({ 
            valid: true, 
            updated: true,
            checksum,
            message: 'Source updated - requires re-approval'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        valid: true, 
        checksum,
        accessible: true,
        sourceType: validation.detectedType || sourceType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function validateSource(uri: string, sourceType: string): Promise<any> {
  try {
    // Try to access the source
    const response = await fetch(uri, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return {
        accessible: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Detect content type
    const contentType = response.headers.get('content-type');
    let detectedType = sourceType;

    if (contentType?.includes('json')) {
      detectedType = 'api';
    } else if (contentType?.includes('xml') || contentType?.includes('rdf')) {
      detectedType = 'ontology';
    } else if (contentType?.includes('html')) {
      detectedType = 'guideline';
    }

    return {
      accessible: true,
      detectedType,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      accessible: false,
      error: errorMessage,
    };
  }
}

async function calculateChecksum(uri: string, sourceType: string): Promise<string> {
  try {
    // For APIs, use timestamp-based versioning
    if (sourceType === 'api') {
      return `api-${Date.now()}`;
    }

    // For static resources, try to fetch and hash
    const response = await fetch(uri, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return `unknown-${Date.now()}`;
    }

    const content = await response.text();
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `v${Math.abs(hash).toString(36)}`;
  } catch (error) {
    return `error-${Date.now()}`;
  }
}

function incrementVersion(currentVersion: string): string {
  const match = currentVersion.match(/^v?(\d+)\.(\d+)$/);
  if (match) {
    const [, major, minor] = match;
    return `v${major}.${parseInt(minor) + 1}`;
  }
  return 'v1.1';
}
