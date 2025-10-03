import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { complaintId, archiveType, legalHold, caseNumber } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    // Get complaint data
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .select(`
        *,
        messages:complaint_messages(*)
      `)
      .eq('id', complaintId)
      .single();

    if (complaintError) throw complaintError;

    // Create immutable archive
    const archivedData = {
      complaint: complaint,
      archivedAt: new Date().toISOString(),
      archivedBy: user.id,
      version: '1.0'
    };

    // Create SHA-256 hash for integrity
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(archivedData));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const { data: archive, error } = await supabase
      .from('legal_archives')
      .insert({
        complaint_id: complaintId,
        archive_type: archiveType,
        legal_hold: legalHold || false,
        case_number: caseNumber,
        archived_data: archivedData,
        archived_by: user.id,
        archive_hash: hashHex
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        archiveId: archive.id,
        hash: hashHex,
        timestamp: archive.created_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Legal archive error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
