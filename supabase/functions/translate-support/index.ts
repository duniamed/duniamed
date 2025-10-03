import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * C7 SUPPORT - Multilingual Translation Service
 * 
 * PURPOSE:
 * - Translate support messages in real-time
 * - Cache translations to reduce API calls
 * - Support patient-specialist communication across languages
 * 
 * INTEGRATIONS:
 * - Lovable AI for translation (Google Gemini)
 * - Translation cache database for performance
 * 
 * WORKFLOW:
 * 1. Receive text and target language
 * 2. Check cache for existing translation
 * 3. If not cached, call Lovable AI
 * 4. Store translation in cache
 * 5. Return translated text
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, sourceLanguage, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cached } = await supabase
      .from('translation_cache')
      .select('translated_text')
      .eq('source_text', text)
      .eq('source_language', sourceLanguage || 'auto')
      .eq('target_language', targetLanguage)
      .single();

    if (cached) {
      console.log('Translation cache hit');
      return new Response(
        JSON.stringify({ translatedText: cached.translated_text, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI for translation
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate the given text accurately while preserving the tone and context. Only return the translated text, nothing else.'
          },
          {
            role: 'user',
            content: `Translate this text to ${targetLanguage}: "${text}"`
          }
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Translation service rate limited. Please try again shortly.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: 'Translation service requires payment. Please contact support.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error('Translation failed');
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content || text;

    // Cache the translation
    await supabase
      .from('translation_cache')
      .insert({
        source_text: text,
        source_language: sourceLanguage || 'auto',
        target_language: targetLanguage,
        translated_text: translatedText,
      });

    console.log('Translation successful and cached');
    return new Response(
      JSON.stringify({ translatedText, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Translation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
