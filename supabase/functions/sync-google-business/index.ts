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
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    const { action, owner_type, profile_data } = await req.json();

    if (action === 'create' || action === 'update') {
      // Get owner details
      let ownerId, ownerData;
      
      if (owner_type === 'specialist') {
        const { data: specialist } = await supabase
          .from('specialists')
          .select('*, profiles:user_id(first_name, last_name, email, phone)')
          .eq('user_id', user.id)
          .single();

        if (!specialist) throw new Error('Specialist not found');
        ownerId = specialist.id;
        ownerData = specialist;
      } else if (owner_type === 'clinic') {
        const { data: clinic } = await supabase
          .from('clinics')
          .select('*')
          .eq('created_by', user.id)
          .single();

        if (!clinic) throw new Error('Clinic not found');
        ownerId = clinic.id;
        ownerData = clinic;
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('google_business_profiles')
        .select('*')
        .eq(owner_type === 'specialist' ? 'specialist_id' : 'clinic_id', ownerId)
        .single();

      // Prepare Google My Business API data
      const gmbData = {
        name: owner_type === 'specialist' 
          ? `Dr. ${ownerData.profiles?.first_name} ${ownerData.profiles?.last_name}`
          : ownerData.name,
        primaryCategory: owner_type === 'specialist' 
          ? `gcid:physician_specialist` 
          : `gcid:medical_clinic`,
        phoneNumbers: {
          primaryPhone: ownerData.phone || ownerData.profiles?.phone
        },
        websiteUrl: owner_type === 'clinic' ? ownerData.website : null,
        ...profile_data
      };

      // In production, call Google My Business API here
      // const gmbResponse = await fetch('https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${accessToken}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(gmbData)
      // });

      // Simulate GMB API response
      const mockGmbResponse = {
        name: `accounts/123/locations/${Date.now()}`,
        locationName: gmbData.name,
        primaryCategory: gmbData.primaryCategory,
        phoneNumbers: gmbData.phoneNumbers,
        profile: {
          description: profile_data.description || ''
        }
      };

      // Upsert profile record
      const profileRecord = {
        owner_type,
        specialist_id: owner_type === 'specialist' ? ownerId : null,
        clinic_id: owner_type === 'clinic' ? ownerId : null,
        google_account_id: 'accounts/123', // From OAuth
        google_location_id: mockGmbResponse.name,
        profile_status: 'created',
        business_name: gmbData.name,
        primary_category: gmbData.primaryCategory,
        phone: gmbData.phoneNumbers.primaryPhone,
        website_url: gmbData.websiteUrl,
        sync_enabled: true,
        last_sync_at: new Date().toISOString()
      };

      let result;
      if (existingProfile) {
        const { data, error } = await supabase
          .from('google_business_profiles')
          .update(profileRecord)
          .eq('id', existingProfile.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('google_business_profiles')
          .insert(profileRecord)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      return new Response(
        JSON.stringify({ 
          profile: result,
          message: 'Google Business Profile synced successfully',
          verification_needed: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      const { profile_id, verification_code } = await req.json();

      // In production, verify with Google API
      // const verificationResponse = await fetch(`https://mybusinessverifications.googleapis.com/v1/${locationName}:verify`, ...);

      await supabase
        .from('google_business_profiles')
        .update({
          profile_status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', profile_id);

      return new Response(
        JSON.stringify({ message: 'Profile verified successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sync_hours') {
      const { profile_id, hours } = await req.json();

      // Update Google My Business hours
      await supabase
        .from('google_business_profiles')
        .update({
          regular_hours: hours,
          last_sync_at: new Date().toISOString()
        })
        .eq('id', profile_id);

      return new Response(
        JSON.stringify({ message: 'Hours synced successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Google Business sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});