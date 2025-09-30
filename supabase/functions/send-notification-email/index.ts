import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  type: 'appointment_confirmation' | 'appointment_reminder' | 'appointment_cancelled' | 'prescription_ready';
  data: {
    patientName?: string;
    specialistName?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    appointmentId?: string;
    prescriptionId?: string;
    [key: string]: any;
  };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(RESEND_API_KEY);
    const { to, subject, type, data }: EmailRequest = await req.json();

    console.log('Sending email:', { to, subject, type });

    // Generate email HTML based on type
    let html = '';
    switch (type) {
      case 'appointment_confirmation':
        html = `
          <h1>Appointment Confirmed</h1>
          <p>Dear ${data.patientName},</p>
          <p>Your appointment with Dr. ${data.specialistName} has been confirmed.</p>
          <p><strong>Date:</strong> ${data.appointmentDate}</p>
          <p><strong>Time:</strong> ${data.appointmentTime}</p>
          <p>You can view your appointment details <a href="${Deno.env.get('APP_URL')}/appointments/${data.appointmentId}">here</a>.</p>
        `;
        break;
      case 'appointment_reminder':
        html = `
          <h1>Appointment Reminder</h1>
          <p>Dear ${data.patientName},</p>
          <p>This is a reminder about your upcoming appointment with Dr. ${data.specialistName}.</p>
          <p><strong>Date:</strong> ${data.appointmentDate}</p>
          <p><strong>Time:</strong> ${data.appointmentTime}</p>
        `;
        break;
      case 'appointment_cancelled':
        html = `
          <h1>Appointment Cancelled</h1>
          <p>Dear ${data.patientName},</p>
          <p>Your appointment with Dr. ${data.specialistName} has been cancelled.</p>
          <p>If you have any questions, please contact support.</p>
        `;
        break;
      case 'prescription_ready':
        html = `
          <h1>Prescription Ready</h1>
          <p>Dear ${data.patientName},</p>
          <p>Your prescription from Dr. ${data.specialistName} is ready.</p>
          <p>You can view it <a href="${Deno.env.get('APP_URL')}/prescriptions">here</a>.</p>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: 'Healthcare Platform <noreply@yourdomain.com>',
      to: [to],
      subject,
      html,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
