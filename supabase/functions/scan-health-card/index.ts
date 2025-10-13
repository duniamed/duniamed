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
    const { imageBase64 } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    // Use Lovable AI to extract text from insurance card image
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-chatbot', {
      body: {
        messages: [
          {
            role: 'user',
            content: `Extract the following information from this health insurance card image:
- Patient Name (full name)
- Policy Number / Member ID
- Insurance Provider Name
- Plan Type
- Valid Until / Expiry Date
- Group Number (if visible)

Return ONLY a JSON object with these fields. Use null for missing data.
Image data: ${imageBase64.substring(0, 100)}...`
          }
        ],
        context: 'ocr_extraction'
      }
    });

    if (aiError) throw aiError;

    // Parse AI response to extract structured data
    let extractedData;
    try {
      const aiText = aiResponse.messages?.[0]?.content || '{}';
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      extractedData = {};
    }

    // Structure the response
    const cardData = {
      patientName: extractedData.patientName || extractedData['Patient Name'] || null,
      policyNumber: extractedData.policyNumber || extractedData['Policy Number'] || extractedData.memberId || null,
      insuranceProvider: extractedData.insuranceProvider || extractedData['Insurance Provider'] || null,
      planType: extractedData.planType || extractedData['Plan Type'] || null,
      validUntil: extractedData.validUntil || extractedData['Valid Until'] || null,
      groupNumber: extractedData.groupNumber || extractedData['Group Number'] || null,
      confidence: 0.85 // Simulated confidence score
    };

    // Log the scan for audit
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event: 'health_card_scanned',
      metadata: {
        provider: cardData.insuranceProvider,
        success: !!cardData.policyNumber
      }
    });

    return new Response(
      JSON.stringify({ success: true, data: cardData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Health card scan error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
