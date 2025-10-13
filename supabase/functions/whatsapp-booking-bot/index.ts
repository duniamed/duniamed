import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingSession {
  state: 'greeting' | 'symptom_input' | 'specialist_selection' | 'patient_details' | 'confirmation';
  symptom?: string;
  specialtyNeeded?: string;
  selectedSpecialist?: any;
  patientName?: string;
  patientCPF?: string;
  phoneNumber?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { from, message, messageId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get or create conversation session
    const sessionKey = `whatsapp_session_${from}`;
    let session: BookingSession = { state: 'greeting' };
    
    // Try to retrieve existing session (in production, use Redis or Supabase)
    // For now, parse state from message context
    
    let responseMessage = '';

    // State machine for booking flow
    if (message.toLowerCase().includes('hi') || message.toLowerCase().includes('hello') || message.toLowerCase() === '1' || session.state === 'greeting') {
      responseMessage = `🏥 *Welcome to DuniaMed!*

I'm your virtual health assistant. I can help you:

1️⃣ Book an appointment
2️⃣ Reschedule existing appointment
3️⃣ Check appointment status
4️⃣ Speak to a human

What would you like to do? Reply with a number.`;
      session.state = 'greeting';

    } else if (message === '1' || message.toLowerCase().includes('book')) {
      responseMessage = `Great! Let's find you the right doctor.

*What's bothering you today?*

Please describe your symptoms or health concern. For example:
• "I have chest pain"
• "Severe headache with nausea"
• "Need a checkup"`;
      session.state = 'symptom_input';

    } else if (session.state === 'symptom_input' || message.length > 10) {
      // Use AI to analyze symptoms and suggest specialty
      const { data: aiData } = await supabase.functions.invoke('ai-symptom-checker', {
        body: {
          symptoms: message,
          context: 'specialist_recommendation'
        }
      });

      const specialty = aiData?.recommendedSpecialty || 'general_practice';
      
      // Find available specialists
      const { data: specialists, error } = await supabase
        .from('specialists')
        .select(`
          id,
          user_id,
          specialty,
          bio,
          profiles!specialists_user_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .contains('specialty', [specialty])
        .eq('is_accepting_patients', true)
        .limit(2);

      if (error || !specialists || specialists.length === 0) {
        responseMessage = `I couldn't find available specialists for your symptoms. Would you like to:

1️⃣ Try a General Practitioner
2️⃣ Speak to a human receptionist

Reply with 1 or 2.`;
      } else {
        let specialistList = `🩺 Based on your symptoms, I recommend:\n\n*${specialty.replace('_', ' ').toUpperCase()}*\n\nWe have ${specialists.length} available specialist(s):\n\n`;
        
        specialists.forEach((spec: any, idx: number) => {
          specialistList += `${idx + 1}️⃣ Dr. ${spec.profiles.first_name} ${spec.profiles.last_name}\n`;
          specialistList += `   ${spec.bio?.substring(0, 50)}...\n\n`;
        });

        specialistList += `Reply with *1* or *2* to choose.`;
        responseMessage = specialistList;

        session.state = 'specialist_selection';
        session.symptom = message;
        session.specialtyNeeded = specialty;
      }

    } else if (session.state === 'specialist_selection' && (message === '1' || message === '2')) {
      responseMessage = `Excellent choice! Before I confirm your appointment, I need a few details:

*What's your full name?*`;
      session.state = 'patient_details';
      session.selectedSpecialist = message;

    } else if (session.state === 'patient_details' && !session.patientName) {
      responseMessage = `Perfect, ${message}!

*Now, what's your CPF (Tax ID)?*

Format: XXX.XXX.XXX-XX`;
      session.patientName = message;

    } else if (session.state === 'patient_details' && !session.patientCPF) {
      // Validate CPF format
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      if (!cpfRegex.test(message)) {
        responseMessage = `Please enter a valid CPF in format XXX.XXX.XXX-XX`;
      } else {
        session.patientCPF = message;
        
        // Create appointment
        const { data: appointment, error } = await supabase
          .from('appointments')
          .insert({
            patient_id: null, // Will be linked after user registers
            specialist_id: session.selectedSpecialist === '1' ? 'specialist_id_1' : 'specialist_id_2',
            scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            consultation_type: 'telehealth',
            status: 'pending',
            chief_complaint: session.symptom,
            fee: 150.00,
            currency: 'BRL'
          })
          .select()
          .single();

        if (error) {
          responseMessage = `Sorry, there was an error booking your appointment. Please try again or speak to a human (reply 4).`;
        } else {
          responseMessage = `✅ *Appointment Confirmed!*

👤 ${session.patientName}
🩺 Dr. Silva - ${session.specialtyNeeded?.replace('_', ' ')}
📅 Tomorrow at 2:00pm
📍 Online Consultation
💰 R$ 150.00

🔔 I'll remind you 24 hours before.

Need to reschedule? Just message me anytime.

See you soon! 👋`;

          // Log the booking
          await supabase.from('analytics_events').insert({
            user_id: null,
            event: 'whatsapp_booking_completed',
            metadata: {
              phone: from,
              specialty: session.specialtyNeeded,
              appointment_id: appointment.id
            }
          });
        }
        
        session.state = 'confirmation';
      }

    } else {
      responseMessage = `I didn't understand that. Let's start over.

What would you like to do?
1️⃣ Book an appointment
2️⃣ Reschedule appointment
3️⃣ Check status
4️⃣ Speak to human

Reply with a number.`;
      session.state = 'greeting';
    }

    // Send response via WhatsApp (Twilio)
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      const twilioResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: `whatsapp:${twilioPhoneNumber}`,
            To: `whatsapp:${from}`,
            Body: responseMessage
          })
        }
      );

      if (!twilioResponse.ok) {
        console.error('Twilio error:', await twilioResponse.text());
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: responseMessage, session }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('WhatsApp bot error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
