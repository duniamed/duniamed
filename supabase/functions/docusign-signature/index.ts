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
    const { documentType, documentId, signerEmail, signerName, documentBase64 } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    // Create DocuSign envelope
    const docusignResponse = await fetch('https://demo.docusign.net/restapi/v2.1/accounts/YOUR_ACCOUNT_ID/envelopes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('DOCUSIGN_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailSubject: `Sign ${documentType}`,
        documents: [{
          documentBase64: documentBase64,
          name: documentType,
          fileExtension: 'pdf',
          documentId: '1'
        }],
        recipients: {
          signers: [{
            email: signerEmail,
            name: signerName,
            recipientId: '1',
            routingOrder: '1',
            tabs: {
              signHereTabs: [{
                anchorString: '/signature/',
                anchorUnits: 'pixels',
                anchorXOffset: '0',
                anchorYOffset: '0'
              }]
            }
          }]
        },
        status: 'sent'
      })
    });

    if (!docusignResponse.ok) {
      throw new Error('DocuSign envelope creation failed');
    }

    const envelopeData = await docusignResponse.json();

    // Store signature record
    const { data: signature, error } = await supabase
      .from('document_signatures')
      .insert({
        document_type: documentType,
        document_id: documentId,
        signer_id: user.id,
        docusign_envelope_id: envelopeData.envelopeId,
        signature_status: 'sent',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        signatureId: signature.id,
        envelopeId: envelopeData.envelopeId,
        signingUrl: envelopeData.url
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('DocuSign error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
