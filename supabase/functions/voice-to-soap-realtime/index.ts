import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { transcriptionText, appointmentId } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Processing voice transcription for appointment: ${appointmentId}`);

    // Use AI to extract SOAP structure from transcription
    const soapExtractionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp',
        messages: [
          {
            role: 'system',
            content: `You are a medical transcription AI. Extract SOAP note components from consultation transcripts.
Return a JSON object with these fields:
- subjective: Patient's chief complaint and symptoms
- objective: Physical examination findings
- assessment: Preliminary diagnosis
- plan: Treatment recommendations
- icd10_suggestions: Array of relevant ICD-10 codes with descriptions
- prescription_suggestions: Array of medication recommendations`
          },
          {
            role: 'user',
            content: `Extract SOAP note from this consultation transcript:\n\n${transcriptionText}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!soapExtractionResponse.ok) {
      const error = await soapExtractionResponse.text();
      console.error('SOAP extraction error:', error);
      throw new Error('SOAP extraction failed');
    }

    const soapData = await soapExtractionResponse.json();
    const extractedSOAP = JSON.parse(soapData.choices[0].message.content);

    // Get specialist ID
    const { data: appointment } = await supabase
      .from('appointments')
      .select('specialist_id')
      .eq('id', appointmentId)
      .single();

    // Log transcription
    await supabase.from('voice_transcriptions').insert({
      appointment_id: appointmentId,
      specialist_id: appointment?.specialist_id,
      transcription_text: transcriptionText,
      audio_duration_seconds: 0
    });

    return new Response(JSON.stringify({
      success: true,
      transcription: transcriptionText,
      soap: extractedSOAP
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Voice-to-SOAP error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});