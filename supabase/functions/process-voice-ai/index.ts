// Unlimited Edge Function Capacities: No limits on invocations, processing, or resources
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, sessionType, context } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = '';
    let responseSchema: any = null;

    // Configure AI based on session type
    switch (sessionType) {
      case 'soap_note':
        systemPrompt = `You are a medical AI assistant helping create SOAP notes. 
Convert the voice transcript into a structured SOAP note with these sections:
- Subjective: Patient's symptoms and complaints
- Objective: Observable findings
- Assessment: Diagnosis and clinical impression  
- Plan: Treatment recommendations and follow-up

Format as JSON with these exact keys: subjective, objective, assessment, plan.`;
        break;

      case 'icd_suggestion':
        systemPrompt = `You are a medical coding AI assistant. Based on the symptoms and diagnosis described, 
suggest the most appropriate ICD-10 codes. Return a JSON array of objects with:
- code: The ICD-10 code
- description: What the code represents
- confidence: Your confidence level (0-1)
- reasoning: Brief explanation

Only suggest codes you're highly confident about.`;
        break;

      case 'patient_query':
        systemPrompt = `You are a helpful medical assistant. The user is searching for patient information.
Parse their natural language query and return structured search parameters as JSON:
- patientName: Extracted patient name if mentioned
- dateRange: Any date references
- symptoms: Any symptoms or conditions mentioned
- urgency: Whether this seems urgent (true/false)
- searchType: Type of search (by_name, by_symptom, by_date, general)`;
        break;

      case 'task_creation':
        systemPrompt = `You are a clinical workflow assistant. Parse the voice command to create a clinical task.
Return JSON with:
- title: Short task title
- description: Detailed task description
- priority: low, medium, high, or urgent
- taskType: follow_up, review_labs, insurance_check, or billing
- dueDate: Suggested due date (ISO format) if mentioned
- patientId: Patient identifier if mentioned`;
        break;

      default:
        systemPrompt = `You are a helpful medical AI assistant. Provide clear, concise responses to healthcare queries.
Focus on being accurate, empathetic, and actionable.`;
    }

    // Call OpenAI API (unlimited edge function capacity)
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript }
        ],
        temperature: 0.3,
        response_format: sessionType !== 'general' ? { type: 'json_object' } : undefined
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', openAIResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const aiData = await openAIResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Parse JSON response for structured types
    let parsedResponse = aiContent;
    if (sessionType !== 'general') {
      try {
        parsedResponse = JSON.parse(aiContent);
      } catch (e) {
        console.error('Failed to parse AI JSON response:', e);
        parsedResponse = { raw: aiContent, parseError: true };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sessionType,
        transcript,
        response: parsedResponse,
        model: 'gpt-4o-mini',
        processedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Voice AI processing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error processing voice input' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
