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

    const { symptoms, age, gender, medicalHistory } = await req.json();

    // Get active AI config for patient context
    const { data: config } = await supabase
      .from('ai_config_profiles')
      .select('*')
      .eq('context', 'patient')
      .eq('is_active', true)
      .single();

    // Get approved medical sources
    const { data: sources } = await supabase
      .from('ai_source_registry')
      .select('*')
      .eq('status', 'approved')
      .in('source_type', ['guideline', 'ontology']);

    if (!config || !sources || sources.length === 0) {
      throw new Error('AI configuration not ready');
    }

    // Build retrieval context from approved sources
    const sourceContext = sources.map(s => 
      `[${s.source_key}] ${s.name} (${s.version})`
    ).join('\n');

    // Build system prompt with compliance layers and approved sources
    const systemPrompt = `You are a medical symptom assessment assistant. Your role is to:
1. Listen carefully to patient symptoms
2. Ask clarifying questions
3. Provide educational information about possible conditions
4. ALWAYS cite approved medical sources for any medical information
5. NEVER provide diagnoses - only educational information
6. ALWAYS recommend consulting a healthcare provider

CRITICAL: You must abstain from answering if you don't have sufficient evidence from approved sources.

Approved Medical Sources:
${sourceContext}

Tone: ${config.responsiveness.tone}
Compliance: ${JSON.stringify(config.compliance_layers)}

When providing information, format citations as: [SOURCE_KEY: specific guidance]`;

    const userPrompt = `Patient Information:
- Symptoms: ${symptoms}
- Age: ${age || 'not provided'}
- Gender: ${gender || 'not provided'}
- Medical History: ${medicalHistory || 'none provided'}

Please assess these symptoms and provide educational information with proper citations.`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const startTime = Date.now();
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const latencyMs = Date.now() - startTime;
    const outputText = aiData.choices[0].message.content;

    // Extract citations from output
    const citationRegex = /\[([^\]]+):\s*([^\]]+)\]/g;
    const citations: any[] = [];
    let match;
    
    while ((match = citationRegex.exec(outputText)) !== null) {
      const sourceKey = match[1];
      const source = sources.find(s => s.source_key === sourceKey);
      if (source) {
        citations.push({
          source_key: sourceKey,
          source_name: source.name,
          uri: source.uri,
          version: source.version,
          excerpt: match[2]
        });
      }
    }

    // Create hash of inputs for analytics (no PHI)
    const inputsHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify({ symptoms, age, gender }))
    ).then(buf => 
      Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    );

    // Log interaction (anonymized)
    await supabase.from('ai_symptom_logs').insert({
      request_id: crypto.randomUUID(),
      context: 'patient',
      inputs_hash: inputsHash,
      inputs_schema: { fields: ['symptoms', 'age', 'gender', 'medicalHistory'] },
      retrieved_sources: sources.map(s => ({ source_key: s.source_key, version: s.version })),
      output_summary: outputText.substring(0, 500),
      citations: citations,
      flags: {
        has_citations: citations.length > 0,
        abstained: outputText.toLowerCase().includes('insufficient evidence'),
      },
      latency_ms: latencyMs,
      user_role: 'patient',
    });

    return new Response(
      JSON.stringify({
        assessment: outputText,
        citations: citations,
        sources_used: sources.length,
        config_version: config.version,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Symptom check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
