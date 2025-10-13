// Unlimited Edge Function Capacities: No limits on invocations, processing, or resources
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      clinic_id, 
      email, 
      role, 
      invited_by,
      metadata 
    } = await req.json();

    // Validate clinic admin
    const { data: clinic } = await supabaseClient
      .from('clinics')
      .select('id, name')
      .eq('id', clinic_id)
      .eq('created_by', invited_by)
      .single();

    if (!clinic) {
      throw new Error('Unauthorized: You must be a clinic admin');
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('staff_invitations')
      .insert({
        clinic_id,
        invited_by,
        email,
        role,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    // Send invitation email
    const inviteLink = `${Deno.env.get('SITE_URL')}/accept-invitation?token=${invitation.invite_token}`;
    
    await supabaseClient.functions.invoke('send-email', {
      body: {
        to: email,
        subject: `You've been invited to join ${clinic.name}`,
        html: `
          <h1>Invitation to Join ${clinic.name}</h1>
          <p>You've been invited to join ${clinic.name} as a ${role}.</p>
          <p>Click the link below to accept this invitation and complete your profile:</p>
          <a href="${inviteLink}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
          <p>This invitation expires in 7 days.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        `
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation_id: invitation.id,
        invite_link: inviteLink
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});