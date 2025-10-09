import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
      throw new Error('Unauthorized');
    }

    // Verify admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    const { 
      instruction, 
      scope, 
      context, 
      affectsClinical, 
      requiresDualApproval 
    } = await req.json();

    // Parse meta instruction
    const parsed = await parseMetaInstruction(instruction);

    // Determine if dual approval needed
    const needsDualApproval = requiresDualApproval || affectsClinical || parsed.impact === 'high';

    // Create meta instruction record
    const { data: metaRecord, error: metaError } = await supabase
      .from('ai_policy_audit')
      .insert({
        action: 'meta_instruction',
        actor_id: user.id,
        diff: {
          instruction,
          parsed,
          scope,
          context,
          impact: parsed.impact,
        },
        justification: `Meta instruction: ${instruction}`,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      })
      .select()
      .single();

    if (metaError) throw metaError;

    // Apply instruction if auto-approved
    let applied = false;
    if (!needsDualApproval) {
      applied = await applyMetaInstruction(supabase, parsed, user.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        metaRecordId: metaRecord.id,
        parsed,
        needsDualApproval,
        applied,
        message: needsDualApproval 
          ? 'Meta instruction logged - requires secondary approval'
          : 'Meta instruction applied successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function parseMetaInstruction(instruction: string): Promise<any> {
  // Simple NLP-like parsing of meta instructions
  const lower = instruction.toLowerCase();
  
  let action = 'modify';
  let target = 'config';
  let impact = 'medium';
  
  // Detect action
  if (lower.includes('expand') || lower.includes('add')) {
    action = 'expand';
  } else if (lower.includes('restrict') || lower.includes('remove')) {
    action = 'restrict';
  } else if (lower.includes('enable') || lower.includes('activate')) {
    action = 'enable';
  } else if (lower.includes('disable') || lower.includes('deactivate')) {
    action = 'disable';
  }
  
  // Detect target
  if (lower.includes('symptom checker') || lower.includes('symptom-checker')) {
    target = 'symptom_checker';
  } else if (lower.includes('source') || lower.includes('knowledge')) {
    target = 'sources';
  } else if (lower.includes('tone') || lower.includes('responsiveness')) {
    target = 'behavior';
  } else if (lower.includes('compliance') || lower.includes('policy')) {
    target = 'compliance';
  }
  
  // Detect impact
  if (lower.includes('critical') || lower.includes('clinical') || lower.includes('patient safety')) {
    impact = 'high';
  } else if (lower.includes('minor') || lower.includes('cosmetic')) {
    impact = 'low';
  }
  
  // Extract parameters
  const parameters: any = {};
  
  if (lower.includes('physiotherapy')) {
    parameters.domain = 'physiotherapy';
  }
  if (lower.includes('pattern')) {
    parameters.features = ['pattern_recognition'];
  }
  
  return {
    action,
    target,
    impact,
    parameters,
    original: instruction,
  };
}

async function applyMetaInstruction(supabase: any, parsed: any, userId: string): Promise<boolean> {
  try {
    // Apply based on parsed action and target
    switch (parsed.target) {
      case 'symptom_checker':
        return await expandSymptomChecker(supabase, parsed, userId);
      case 'sources':
        return await modifySources(supabase, parsed, userId);
      case 'behavior':
        return await modifyBehavior(supabase, parsed, userId);
      case 'compliance':
        return await modifyCompliance(supabase, parsed, userId);
      default:
        console.log('Meta instruction logged but not auto-applied:', parsed);
        return false;
    }
  } catch (error) {
    console.error('Error applying meta instruction:', error);
    return false;
  }
}

async function expandSymptomChecker(supabase: any, parsed: any, userId: string): Promise<boolean> {
  // Example: Register new module or update existing
  const { data, error } = await supabase
    .from('ai_symptom_checker_modules')
    .insert({
      module_key: `auto_${parsed.parameters.domain || 'general'}_${Date.now()}`,
      description: `Auto-generated from meta instruction: ${parsed.original}`,
      version: 'v1.0',
      status: 'pending',
      owning_team: 'ai_ops',
    });
  
  return !error;
}

async function modifySources(supabase: any, parsed: any, userId: string): Promise<boolean> {
  // Placeholder for source modification logic
  return false;
}

async function modifyBehavior(supabase: any, parsed: any, userId: string): Promise<boolean> {
  // Placeholder for behavior modification logic
  return false;
}

async function modifyCompliance(supabase: any, parsed: any, userId: string): Promise<boolean> {
  // Placeholder for compliance modification logic
  return false;
}
