// UNLIMITED EDGE FUNCTION CAPACITIES: Voice Navigation Command Processing
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

    const { voiceCommand } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    console.log(`Processing voice navigation command: ${voiceCommand}`);

    // Use AI to map voice command to route
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a navigation assistant. Map voice commands to routes.
Available routes:
- /dashboard: main dashboard
- /appointments: appointments page
- /patients: patient list
- /schedule: schedule management
- /earnings: earnings overview
- /settings: user settings
- /messages: messaging
- /care-teams: care team management
- /work-queue: work queue
- /rpm-dashboard: RPM monitoring
- /analytics: analytics dashboard

Return JSON: { "route": "/path", "action": "navigate|action" }`
          },
          {
            role: 'user',
            content: voiceCommand
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.choices[0].message.content);

    // Log navigation command
    await supabase.from('voice_navigation_logs').insert({
      user_id: user.id,
      command: voiceCommand,
      mapped_route: result.route,
      action: result.action
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Voice navigation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
