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

    const { provider, user_id } = await req.json();

    // Get calendar provider tokens
    const { data: calProvider, error: provError } = await supabase
      .from('calendar_providers')
      .select('*')
      .eq('user_id', user_id || user.id)
      .eq('provider', provider)
      .eq('sync_enabled', true)
      .single();

    if (provError || !calProvider) {
      throw new Error('Calendar not connected');
    }

    // Fetch platform appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .or(`patient_id.eq.${user.id},specialist_id.in.(SELECT id FROM specialists WHERE user_id='${user.id}')`)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at');

    let externalEvents: any[] = [];

    // Fetch external calendar events
    if (provider === 'google') {
      const eventsResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calProvider.calendar_id || 'primary'}/events?timeMin=${new Date().toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${calProvider.access_token}`,
          },
        }
      );

      if (!eventsResponse.ok) {
        if (eventsResponse.status === 401) {
          // Token expired, trigger refresh
          await supabase.functions.invoke('calendar-token-refresh', {
            body: { user_id: user.id, provider }
          });
          throw new Error('Token expired, retry after refresh');
        }
        throw new Error(`Google Calendar API error: ${eventsResponse.status}`);
      }

      const eventsData = await eventsResponse.json();
      externalEvents = eventsData.items || [];
    } else if (provider === 'outlook') {
      const eventsResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendar/events?$filter=start/dateTime ge '${new Date().toISOString()}'`,
        {
          headers: {
            'Authorization': `Bearer ${calProvider.access_token}`,
          },
        }
      );

      if (!eventsResponse.ok) {
        throw new Error(`Outlook API error: ${eventsResponse.status}`);
      }

      const eventsData = await eventsResponse.json();
      externalEvents = eventsData.value || [];
    }

    const conflicts: any[] = [];
    const synced: any[] = [];

    // Bi-directional sync with conflict detection
    for (const appointment of appointments || []) {
      const apptStart = new Date(appointment.scheduled_at);
      const apptEnd = new Date(apptStart.getTime() + (appointment.duration_minutes || 30) * 60000);

      // Check if appointment exists in external calendar
      const existingEvent = externalEvents.find((e: any) => {
        const eventStart = provider === 'google' 
          ? new Date(e.start.dateTime || e.start.date)
          : new Date(e.start.dateTime);
        
        return Math.abs(eventStart.getTime() - apptStart.getTime()) < 60000; // Within 1 minute
      });

      if (!existingEvent) {
        // Create in external calendar
        const eventBody = provider === 'google' ? {
          summary: `Appointment - ${appointment.id.slice(0, 8)}`,
          start: { dateTime: apptStart.toISOString() },
          end: { dateTime: apptEnd.toISOString() },
          description: `Platform appointment ID: ${appointment.id}`,
        } : {
          subject: `Appointment - ${appointment.id.slice(0, 8)}`,
          start: { dateTime: apptStart.toISOString(), timeZone: 'UTC' },
          end: { dateTime: apptEnd.toISOString(), timeZone: 'UTC' },
          body: { content: `Platform appointment ID: ${appointment.id}` },
        };

        const createUrl = provider === 'google'
          ? `https://www.googleapis.com/calendar/v3/calendars/${calProvider.calendar_id || 'primary'}/events`
          : 'https://graph.microsoft.com/v1.0/me/calendar/events';

        await fetch(createUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${calProvider.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        });

        synced.push({ appointment_id: appointment.id, action: 'created' });
      } else {
        // Check for conflicts (different times)
        const externalStart = provider === 'google'
          ? new Date(existingEvent.start.dateTime || existingEvent.start.date)
          : new Date(existingEvent.start.dateTime);

        if (Math.abs(externalStart.getTime() - apptStart.getTime()) > 60000) {
          conflicts.push({
            appointment_id: appointment.id,
            platform_time: apptStart.toISOString(),
            external_time: externalStart.toISOString(),
            resolution: 'platform_wins', // Default conflict policy
          });

          // Platform wins - update external calendar
          const updateUrl = provider === 'google'
            ? `https://www.googleapis.com/calendar/v3/calendars/${calProvider.calendar_id || 'primary'}/events/${existingEvent.id}`
            : `https://graph.microsoft.com/v1.0/me/calendar/events/${existingEvent.id}`;

          const updateBody = provider === 'google' ? {
            start: { dateTime: apptStart.toISOString() },
            end: { dateTime: apptEnd.toISOString() },
          } : {
            start: { dateTime: apptStart.toISOString(), timeZone: 'UTC' },
            end: { dateTime: apptEnd.toISOString(), timeZone: 'UTC' },
          };

          await fetch(updateUrl, {
            method: provider === 'google' ? 'PATCH' : 'PATCH',
            headers: {
              'Authorization': `Bearer ${calProvider.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateBody),
          });
        }
      }
    }

    // Update last sync timestamp
    await supabase
      .from('calendar_providers')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', calProvider.id);

    return new Response(JSON.stringify({
      success: true,
      synced: synced.length,
      conflicts: conflicts.length,
      conflict_details: conflicts,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Calendar sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});