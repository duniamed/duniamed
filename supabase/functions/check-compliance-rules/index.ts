import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { clinic_id, appointment_data } = await req.json();

    if (!clinic_id || !appointment_data) {
      throw new Error('clinic_id and appointment_data are required');
    }

    // Fetch active compliance rules for the clinic
    const { data: rules, error: rulesError } = await supabase
      .from('appointment_compliance_rules')
      .select('*')
      .eq('clinic_id', clinic_id)
      .eq('is_active', true)
      .eq('enforcement_enabled', true)
      .order('priority', { ascending: false });

    if (rulesError) throw rulesError;

    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        compliant: true,
        message: 'No compliance rules to check'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const violations = [];
    const warnings = [];
    const actions = [];

    for (const rule of rules) {
      const condition = rule.condition_criteria as any;
      const action = rule.action_required as any;

      let ruleViolated = false;

      // Check various rule types
      if (rule.rule_type === 'insurance_verification_required') {
        if (condition.require_verification_before_booking) {
          // Check if patient has verified insurance
          const { data: insurance } = await supabase
            .from('insurance_verifications')
            .select('*')
            .eq('patient_id', appointment_data.patient_id)
            .eq('verification_status', 'verified')
            .gte('verified_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
            .single();

          if (!insurance) {
            ruleViolated = true;
            violations.push({
              rule_name: rule.rule_name,
              rule_type: rule.rule_type,
              severity: 'high',
              message: 'Insurance verification required before booking'
            });
          }
        }
      }

      if (rule.rule_type === 'minimum_advance_booking') {
        const minHours = condition.minimum_hours || 24;
        const scheduledAt = new Date(appointment_data.scheduled_at);
        const now = new Date();
        const hoursDiff = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < minHours) {
          ruleViolated = true;
          violations.push({
            rule_name: rule.rule_name,
            rule_type: rule.rule_type,
            severity: 'medium',
            message: `Appointments must be booked at least ${minHours} hours in advance`
          });
        }
      }

      if (rule.rule_type === 'credential_verification_required') {
        // Check if specialist has verified credentials
        const { data: credentials } = await supabase
          .from('credential_verifications')
          .select('*')
          .eq('specialist_id', appointment_data.specialist_id)
          .eq('verification_status', 'verified')
          .limit(1);

        if (!credentials || credentials.length === 0) {
          ruleViolated = true;
          violations.push({
            rule_name: rule.rule_name,
            rule_type: rule.rule_type,
            severity: 'critical',
            message: 'Specialist credentials not verified'
          });
        }
      }

      if (rule.rule_type === 'consent_required') {
        const requiredConsents = condition.consent_types || [];
        for (const consentType of requiredConsents) {
          const { data: consent } = await supabase
            .from('privacy_consents')
            .select('*')
            .eq('user_id', appointment_data.patient_id)
            .eq('consent_type', consentType)
            .eq('consent_given', true)
            .single();

          if (!consent) {
            ruleViolated = true;
            warnings.push({
              rule_name: rule.rule_name,
              rule_type: rule.rule_type,
              severity: 'medium',
              message: `Patient consent required for: ${consentType}`
            });
          }
        }
      }

      if (rule.rule_type === 'maximum_appointments_per_day') {
        const maxPerDay = condition.max_appointments || 10;
        const targetDate = new Date(appointment_data.scheduled_at).toISOString().split('T')[0];
        
        const { data: existingApts, count } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('specialist_id', appointment_data.specialist_id)
          .gte('scheduled_at', targetDate)
          .lt('scheduled_at', targetDate + ' 23:59:59')
          .in('status', ['pending', 'confirmed']);

        if ((count || 0) >= maxPerDay) {
          ruleViolated = true;
          violations.push({
            rule_name: rule.rule_name,
            rule_type: rule.rule_type,
            severity: 'medium',
            message: `Specialist has reached maximum appointments per day (${maxPerDay})`
          });
        }
      }

      // Collect required actions
      if (ruleViolated && action) {
        if (action.block_booking) {
          actions.push({
            type: 'block',
            message: action.display_message || 'Booking cannot proceed due to compliance rules'
          });
        }
        if (action.require_override) {
          actions.push({
            type: 'require_override',
            required_role: action.override_role || 'admin',
            message: 'Admin override required to proceed'
          });
        }
        if (action.send_notification) {
          actions.push({
            type: 'notification',
            recipients: action.notification_recipients || ['clinic_admin']
          });
        }
      }
    }

    // Update last enforced timestamp
    await supabase
      .from('appointment_compliance_rules')
      .update({ last_enforced_at: new Date().toISOString() })
      .eq('clinic_id', clinic_id)
      .eq('is_active', true);

    const isCompliant = violations.length === 0;
    const requiresBlock = actions.some(a => a.type === 'block');

    console.log('Compliance check completed:', {
      clinic_id,
      rules_checked: rules.length,
      violations: violations.length,
      compliant: isCompliant
    });

    return new Response(JSON.stringify({
      success: true,
      compliant: isCompliant,
      can_proceed: !requiresBlock,
      violations,
      warnings,
      actions,
      message: isCompliant 
        ? 'All compliance checks passed' 
        : `${violations.length} compliance violation(s) found`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-compliance-rules:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});