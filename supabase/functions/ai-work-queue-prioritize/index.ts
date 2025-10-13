// UNLIMITED EDGE FUNCTION CAPACITIES: AI Work Queue Prioritization
// Core Principle: Intelligent task prioritization with ML

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all pending work items
    const { data: workItems, error: itemsError } = await supabase
      .from('work_queue_items')
      .select('*')
      .eq('assigned_to', userId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false });

    if (itemsError) throw itemsError;

    if (!workItems || workItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          prioritizedItems: [],
          message: 'No pending items'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AI-powered prioritization
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const prioritizationPrompt = `You are an intelligent clinical workflow optimizer. Prioritize these work queue items.

WORK ITEMS:
${workItems.map((item, i) => `
${i + 1}. Type: ${item.item_type}, Priority: ${item.priority}, Due: ${item.due_date || 'No deadline'}, Title: ${item.title}
`).join('')}

Return JSON array with re-prioritized items:
[
  {
    "itemId": "uuid",
    "newPriority": "urgent",
    "estimatedMinutes": 10,
    "reasoning": "Why this order",
    "suggestedAction": "Specific next step"
  }
]

Consider: urgency, due dates, item type complexity, patient impact. Prioritize time-sensitive clinical items.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [{ role: 'user', content: prioritizationPrompt }],
        temperature: 0.3,
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const prioritization = JSON.parse(
      aiResponse.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    );

    // Update priorities in database
    for (const item of prioritization) {
      await supabase
        .from('work_queue_items')
        .update({
          priority: item.newPriority,
          metadata: {
            ...workItems.find(w => w.id === item.itemId)?.metadata,
            ai_prioritization: {
              estimatedMinutes: item.estimatedMinutes,
              reasoning: item.reasoning,
              suggestedAction: item.suggestedAction,
              updated_at: new Date().toISOString()
            }
          }
        })
        .eq('id', item.itemId);
    }

    // Get updated list
    const { data: updatedItems } = await supabase
      .from('work_queue_items')
      .select('*')
      .eq('assigned_to', userId)
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    console.log(`Work queue prioritized for user ${userId}: ${prioritization.length} items`);

    return new Response(
      JSON.stringify({
        success: true,
        prioritizedItems: updatedItems,
        aiRecommendations: prioritization,
        summary: {
          urgent: prioritization.filter((p: any) => p.newPriority === 'urgent').length,
          totalEstimatedMinutes: prioritization.reduce((sum: number, p: any) => sum + p.estimatedMinutes, 0)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-work-queue-prioritize:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});