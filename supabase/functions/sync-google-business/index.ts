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

    const { action, owner_id, owner_type, profile_data } = await req.json();

    // Get Google Business Profile integration
    const { data: integration, error: integError } = await supabase
      .from('clinic_integrations')
      .select('*')
      .eq('integration_type', 'google_business_profile')
      .eq('is_active', true)
      .single();

    if (integError || !integration) {
      throw new Error('Google Business Profile not connected');
    }

    const accessToken = integration.access_token;
    const accountId = integration.profile_id;

    if (action === 'sync_reviews') {
      // Fetch reviews from Google Business Profile API
      const reviewsResponse = await fetch(
        `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${profile_data.location_id}/reviews`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!reviewsResponse.ok) {
        if (reviewsResponse.status === 429) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Rate limit exceeded, will retry later',
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error(`Google API error: ${reviewsResponse.status}`);
      }

      const reviewsData = await reviewsResponse.json();

      // Sync reviews to database
      for (const review of reviewsData.reviews || []) {
        await supabase
          .from('reviews')
          .upsert({
            external_id: review.reviewId,
            specialist_id: owner_id,
            rating: review.starRating === 'FIVE' ? 5 : 
                   review.starRating === 'FOUR' ? 4 :
                   review.starRating === 'THREE' ? 3 :
                   review.starRating === 'TWO' ? 2 : 1,
            review_text: review.comment,
            created_at: review.createTime,
            source: 'google',
          }, { onConflict: 'external_id' });
      }

      return new Response(JSON.stringify({
        success: true,
        synced: reviewsData.reviews?.length || 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'upload_photo') {
      const { photo_url, category } = profile_data;

      const photoResponse = await fetch(
        `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${profile_data.location_id}/media`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mediaFormat: 'PHOTO',
            sourceUrl: photo_url,
            category: category || 'EXTERIOR',
          }),
        }
      );

      if (!photoResponse.ok) {
        throw new Error(`Photo upload failed: ${photoResponse.status}`);
      }

      const photoData = await photoResponse.json();

      return new Response(JSON.stringify({
        success: true,
        media_id: photoData.name,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reply_review') {
      const { review_id, reply_text } = profile_data;

      const replyResponse = await fetch(
        `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${profile_data.location_id}/reviews/${review_id}/reply`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: reply_text,
          }),
        }
      );

      if (!replyResponse.ok) {
        throw new Error(`Reply failed: ${replyResponse.status}`);
      }

      return new Response(JSON.stringify({
        success: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: any) {
    console.error('Google Business sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});