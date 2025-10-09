import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Service configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Rate limiting check (strict for content generation)
    const rateLimitResponse = await supabase.functions.invoke('check-rate-limit', {
      body: { 
        endpoint: 'generate-blog-content',
        max_requests: 10,
        window_duration: '1 hour'
      }
    });

    if (rateLimitResponse.data?.rate_limited) {
      return new Response(JSON.stringify({ 
        error: 'Generation limit reached. Please try again later.',
        retry_after: rateLimitResponse.data.retry_after_seconds
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { topic, tone, length, saveDraft = true } = await req.json();

    // Input validation
    if (!topic || typeof topic !== 'string' || topic.length < 5 || topic.length > 200) {
      return new Response(JSON.stringify({ error: 'Invalid topic: must be 5-200 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!['professional', 'casual', 'formal', 'friendly'].includes(tone)) {
      return new Response(JSON.stringify({ error: 'Invalid tone' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!['short', 'medium', 'long'].includes(length)) {
      return new Response(JSON.stringify({ error: 'Invalid length' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Generate blog content:', { topic, tone, length });

    const lengthGuide = {
      short: '300-500 words',
      medium: '700-1000 words',
      long: '1500-2000 words'
    };

    const prompt = `Write a blog post about: ${topic}

Requirements:
- Tone: ${tone}
- Length: ${lengthGuide[length as keyof typeof lengthGuide] || '700-1000 words'}
- Focus on medical news, healthcare innovations, or how Duniamed helps people
- Include real-world examples and use cases
- Make it engaging and informative
- Use clear headings and structure
- Include a compelling introduction and conclusion

Format the response as JSON with:
{
  "title": "Engaging blog post title",
  "excerpt": "Brief summary (150 characters max)",
  "content": "Full blog post content in markdown",
  "tags": ["tag1", "tag2", "tag3"],
  "seoDescription": "SEO-friendly description (160 characters max)",
  "readingTimeMinutes": estimated reading time
}`;

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
            content: 'You are an expert medical content writer for Duniamed, specializing in creating engaging, accurate, and informative healthcare content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Try to parse JSON from response
    let blogData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        blogData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      // Fallback if not JSON format
      blogData = {
        title: topic,
        excerpt: content.substring(0, 150),
        content: content,
        tags: ['healthcare', 'medical'],
        seoDescription: content.substring(0, 160),
        readingTimeMinutes: Math.ceil(content.split(' ').length / 200)
      };
    }

    // Save draft if requested
    if (saveDraft && userId) {
      const { data: draft, error } = await supabase
        .from('content_drafts')
        .insert({
          user_id: userId,
          title: blogData.title,
          content: blogData.content,
          topic,
          tone,
          length,
          ai_metadata: {
            model: 'google/gemini-2.5-flash',
            generated_at: new Date().toISOString(),
            ...blogData
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving draft:', error);
      } else {
        blogData.draftId = draft.id;
      }
    }

    return new Response(
      JSON.stringify(blogData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-content:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate content. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
