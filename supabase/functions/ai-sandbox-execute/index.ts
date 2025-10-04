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

    const { sessionId, testCases } = await req.json();

    // Get sandbox session
    const { data: session } = await supabase
      .from('ai_sandbox_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      throw new Error('Sandbox session not found');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const results = [];
    const config = session.config_snapshot;

    for (const testCase of testCases) {
      const startTime = Date.now();

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: `Test config: ${JSON.stringify(config)}` },
              { role: 'user', content: testCase.input }
            ],
          }),
        });

        const latency = Date.now() - startTime;
        
        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const output = data.choices[0].message.content;

        // Evaluate output quality
        const scores = {
          accuracy: evaluateAccuracy(output, testCase.expectedKeywords),
          compliance: evaluateCompliance(output, config.compliance_layers),
          abstain: output.toLowerCase().includes('cannot') || output.toLowerCase().includes('unable') ? 1 : 0,
          latency: latency < 2000 ? 1 : latency < 5000 ? 0.5 : 0,
        };

        results.push({
          testCase: testCase.name,
          input: testCase.input,
          output: output.substring(0, 500),
          scores,
          latency,
          passed: Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length > 0.7,
        });
      } catch (error) {
        results.push({
          testCase: testCase.name,
          input: testCase.input,
          error: error instanceof Error ? error.message : 'Unknown error',
          passed: false,
        });
      }
    }

    // Update session with results
    await supabase
      .from('ai_sandbox_sessions')
      .update({
        test_results: { tests: results, timestamp: new Date().toISOString() },
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return new Response(JSON.stringify({ results, sessionId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sandbox execution error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function evaluateAccuracy(output: string, expectedKeywords: string[]): number {
  if (!expectedKeywords || expectedKeywords.length === 0) return 1;
  const found = expectedKeywords.filter(kw => 
    output.toLowerCase().includes(kw.toLowerCase())
  );
  return found.length / expectedKeywords.length;
}

function evaluateCompliance(output: string, complianceLayers: any): number {
  let score = 1;
  const lower = output.toLowerCase();
  
  // Check for PII exposure
  if (lower.match(/\b\d{3}-\d{2}-\d{4}\b/)) score -= 0.3; // SSN
  if (lower.match(/\b\d{16}\b/)) score -= 0.3; // Credit card
  
  // Check for appropriate disclaimers
  if (complianceLayers?.HIPAA && !lower.includes('not medical advice')) score -= 0.2;
  
  return Math.max(0, score);
}
