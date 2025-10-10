import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source, url } = await req.json();

    // Extract place ID from Google Maps URL
    const placeIdMatch = url.match(/place\/([^\/]+)/);
    if (!placeIdMatch && source === 'google') {
      throw new Error('Invalid Google Maps URL');
    }

    // For Google Maps, use Places API
    if (source === 'google') {
      const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
      
      if (!GOOGLE_PLACES_API_KEY) {
        throw new Error('Google Places API key not configured');
      }

      const placeId = placeIdMatch[1];
      
      // Fetch place details
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,photos,rating,user_ratings_total,geometry&key=${GOOGLE_PLACES_API_KEY}`
      );

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      const place = data.result;

      // Format the response
      const importedData = {
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number,
        website: place.website,
        hours: place.opening_hours?.weekday_text?.reduce((acc: any, day: string) => {
          const [dayName, hours] = day.split(': ');
          acc[dayName] = hours;
          return acc;
        }, {}),
        rating: place.rating,
        reviews: place.user_ratings_total,
        photos: place.photos?.slice(0, 10).map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
        ) || [],
        coordinates: {
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng,
        },
      };

      return new Response(JSON.stringify(importedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For other sources, return mock data for now
    // TODO: Implement scrapers for Instagram, Yelp, Facebook, Healthgrades
    return new Response(
      JSON.stringify({
        name: 'Sample Clinic',
        address: '123 Main St, City, State 12345',
        phone: '(555) 123-4567',
        email: 'info@sampleclinic.com',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
