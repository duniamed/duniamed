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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { soap_note_id } = await req.json();

    console.log('Extracting billing codes for SOAP note:', soap_note_id);

    // Fetch SOAP note
    const { data: soapNote, error: soapError } = await supabase
      .from('soap_notes')
      .select('*, appointment:appointments(consultation_type, duration_minutes)')
      .eq('id', soap_note_id)
      .single();

    if (soapError) throw soapError;

    // Use AI to extract CPT and ICD codes from SOAP note
    const prompt = `You are a medical billing expert. Extract CPT (procedure) codes and ICD-10 (diagnosis) codes from this SOAP note.

SOAP Note:
Subjective: ${soapNote.subjective || 'N/A'}
Objective: ${soapNote.objective || 'N/A'}
Assessment: ${soapNote.assessment || 'N/A'}
Plan: ${soapNote.plan || 'N/A'}

Consultation Type: ${soapNote.appointment?.consultation_type || 'unknown'}
Duration: ${soapNote.appointment?.duration_minutes || 30} minutes

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "cpt_codes": [
    {"code": "99213", "description": "Office visit, established patient, 20-29 minutes", "units": 1}
  ],
  "icd10_codes": [
    {"code": "E11.9", "description": "Type 2 diabetes without complications"}
  ],
  "modifiers": [],
  "notes": "Brief explanation of code selection"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a medical billing assistant. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No AI response received');
    }

    // Parse AI response
    let extracted;
    try {
      extracted = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback codes based on visit type
      extracted = {
        cpt_codes: [
          {
            code: soapNote.appointment?.duration_minutes > 40 ? '99215' : '99213',
            description: 'Office visit evaluation',
            units: 1
          }
        ],
        icd10_codes: [
          { code: 'Z00.00', description: 'Encounter for general adult medical examination' }
        ],
        modifiers: [],
        notes: 'Default codes applied - manual review recommended'
      };
    }

    // Store billing codes
    const { error: billingError } = await supabase
      .from('billing_records')
      .insert({
        appointment_id: soapNote.appointment_id,
        soap_note_id: soap_note_id,
        patient_id: soapNote.patient_id,
        specialist_id: soapNote.specialist_id,
        cpt_codes: extracted.cpt_codes,
        icd10_codes: extracted.icd10_codes,
        modifiers: extracted.modifiers || [],
        ai_extracted: true,
        extraction_notes: extracted.notes,
        status: 'pending_review',
        created_at: new Date().toISOString(),
      });

    if (billingError) throw billingError;

    // Update SOAP note with billing reference
    await supabase
      .from('soap_notes')
      .update({ billing_extracted: true, billing_extracted_at: new Date().toISOString() })
      .eq('id', soap_note_id);

    console.log('Billing codes extracted successfully:', extracted);

    return new Response(JSON.stringify({
      success: true,
      extracted_codes: extracted,
      message: 'Billing codes extracted and saved for review'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-soap-billing-codes:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
