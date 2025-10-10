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
    const { clinic_id } = await req.json();

    if (!clinic_id) {
      throw new Error('clinic_id is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get clinic data
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinic_id)
      .single();

    if (clinicError || !clinic) {
      throw new Error('Clinic not found');
    }

    // Get Google My Business API credentials
    const GOOGLE_MY_BUSINESS_API_KEY = Deno.env.get('GOOGLE_MY_BUSINESS_API_KEY');
    
    if (!GOOGLE_MY_BUSINESS_API_KEY) {
      throw new Error('Google My Business API not configured. Please add GOOGLE_MY_BUSINESS_API_KEY to secrets.');
    }

    // Create location on Google My Business
    // Note: This requires Google My Business API access and proper authentication
    const response = await fetch('https://mybusinessbusinessinformation.googleapis.com/v1/locations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GOOGLE_MY_BUSINESS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: clinic.name,
        storefrontAddress: {
          addressLines: [clinic.address_line1, clinic.address_line2].filter(Boolean),
          locality: clinic.city,
          administrativeArea: clinic.state,
          postalCode: clinic.postal_code,
          regionCode: clinic.country,
        },
        primaryPhone: clinic.phone,
        websiteUri: clinic.website,
        categories: {
          primaryCategory: {
            displayName: 'Medical Clinic'
          }
        },
        profile: {
          description: clinic.description,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google My Business API error: ${error.error?.message || 'Failed to create listing'}`);
    }

    const listing = await response.json();

    // Update clinic with GMB listing info
    await supabase
      .from('clinic_integrations')
      .upsert({
        clinic_id,
        integration_type: 'google_business_profile',
        profile_id: listing.name,
        profile_data: listing,
        is_active: true,
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        listing,
        message: 'Google Business Profile created. Verification required before it goes live.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create GMB listing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
