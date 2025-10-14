// UNLIMITED EDGE FUNCTION CAPACITIES: Patient Education Content Generator
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
    const { patientId, topic, condition, language } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Generating educational content for ${topic} in ${language || 'English'}`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: `Generate patient education content in ${language || 'English'}. Return JSON: { "title": "", "content": "", "key_points": [], "do_list": [], "dont_list": [], "when_to_seek_help": [], "resources": [], "reading_level": "6th-grade" }` },
          { role: 'user', content: `Create educational content about: ${topic}, related to condition: ${condition}` }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const educationContent = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('patient_education_materials').insert({
      patient_id: patientId,
      topic,
      condition,
      content: educationContent,
      language: language || 'en',
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, educationContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Patient education content error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
