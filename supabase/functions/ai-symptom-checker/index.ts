import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, patientInfo } = await req.json();
    
    // Validate input
    if (!symptoms || typeof symptoms !== 'string') {
      throw new Error('Invalid symptoms data');
    }
    if (symptoms.length > 2000) {
      throw new Error('Symptoms description too long: maximum 2000 characters');
    }

    // Rate limiting check (using IP for anonymous users)
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const authHeader = req.headers.get('Authorization');
    let userId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Apply rate limiting
    const identifier = userId || clientIP;
    const maxRequests = userId ? 50 : 10; // Authenticated: 50/hour, Anonymous: 10/hour (medical AI is expensive)
    
    const { data: rateLimit } = await supabase.functions.invoke('check-rate-limit', {
      body: { 
        endpoint: 'ai-symptom-checker',
        max_requests: maxRequests,
        window_duration: '1 hour'
      }
    });

    if (rateLimit?.rate_limited) {
      return new Response(JSON.stringify({ 
        error: 'Too many symptom checks. Please try again later.',
        retry_after: rateLimit.retry_after_seconds
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimit.retry_after_seconds)
        }
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('Service configuration error');
    }

    console.log('Analyzing symptoms for:', userId || 'anonymous');

    const systemPrompt = `You are a medical AI triage assistant. Analyze patient symptoms and provide:
1. Possible conditions (ranked by likelihood)
2. Recommended specialty to consult
3. Urgency level (emergency, urgent, routine, non-urgent)
4. Red flags that need immediate attention
5. Questions for the doctor

Be clear this is NOT a diagnosis. Format response as JSON.`;

    const userPrompt = `Patient info: ${JSON.stringify(patientInfo)}
Symptoms: ${symptoms}

Provide triage assessment with possible conditions, recommended specialty, urgency level, and red flags.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_triage_assessment",
            description: "Provide medical triage assessment",
            parameters: {
              type: "object",
              properties: {
                possible_conditions: {
                  type: "array",
                  items: { type: "string" }
                },
                recommended_specialty: { type: "string" },
                urgency_level: {
                  type: "string",
                  enum: ["emergency", "urgent", "routine", "non-urgent"]
                },
                red_flags: {
                  type: "array",
                  items: { type: "string" }
                },
                questions_for_doctor: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["possible_conditions", "recommended_specialty", "urgency_level"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "provide_triage_assessment" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    const assessment = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    console.log('Assessment completed:', assessment);

    return new Response(JSON.stringify({ assessment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-symptom-checker:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
