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

    const { archive_id, jurisdiction } = await req.json();

    console.log('Running compliance check:', { archive_id, jurisdiction });

    // Fetch archive entry
    const { data: archive, error: archiveError } = await supabase
      .from('legal_archives')
      .select('*')
      .eq('id', archive_id)
      .single();

    if (archiveError || !archive) {
      throw new Error('Archive entry not found');
    }

    const complianceIssues: Array<{
      severity: 'critical' | 'high' | 'medium' | 'low';
      issue: string;
      recommendation: string;
    }> = [];

    const now = new Date();
    const archivedAt = new Date(archive.archived_at);
    const daysSinceArchive = Math.floor((now.getTime() - archivedAt.getTime()) / (1000 * 60 * 60 * 24));

    // Check retention period compliance
    const retentionDays = archive.retention_period_days || 2555; // Default 7 years (HIPAA)
    const daysRemaining = retentionDays - daysSinceArchive;

    if (daysRemaining < 0) {
      complianceIssues.push({
        severity: 'high',
        issue: 'Document past retention period',
        recommendation: 'Review for secure deletion or extended retention approval'
      });
    } else if (daysRemaining < 90) {
      complianceIssues.push({
        severity: 'medium',
        issue: `Retention period expiring in ${daysRemaining} days`,
        recommendation: 'Schedule review before expiration'
      });
    }

    // Check encryption status
    if (!archive.encryption_key_id) {
      complianceIssues.push({
        severity: 'critical',
        issue: 'Document not encrypted',
        recommendation: 'Apply encryption immediately for PHI/PII protection'
      });
    }

    // Check access controls
    if (!archive.access_controls || Object.keys(archive.access_controls).length === 0) {
      complianceIssues.push({
        severity: 'high',
        issue: 'No access controls defined',
        recommendation: 'Configure role-based access controls'
      });
    }

    // Check audit trail
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('count')
      .eq('resource_type', 'legal_archive')
      .eq('resource_id', archive_id);

    if (!auditLogs || auditLogs.length === 0) {
      complianceIssues.push({
        severity: 'medium',
        issue: 'No audit trail',
        recommendation: 'Enable audit logging for all archive access'
      });
    }

    // Jurisdiction-specific checks
    if (jurisdiction === 'US') {
      // HIPAA compliance checks
      if (archive.document_type === 'medical_record' && !archive.hipaa_compliant) {
        complianceIssues.push({
          severity: 'critical',
          issue: 'HIPAA compliance not verified',
          recommendation: 'Verify PHI handling, encryption, and access controls meet HIPAA standards'
        });
      }
    } else if (jurisdiction === 'EU') {
      // GDPR compliance checks
      if (!archive.gdpr_lawful_basis) {
        complianceIssues.push({
          severity: 'critical',
          issue: 'No GDPR lawful basis documented',
          recommendation: 'Document lawful basis for processing (consent, contract, legal obligation, etc.)'
        });
      }
      
      if (!archive.data_subject_rights_honored) {
        complianceIssues.push({
          severity: 'high',
          issue: 'Data subject rights not documented',
          recommendation: 'Implement process for right to access, erasure, and portability'
        });
      }
    }

    // Check metadata completeness
    const requiredMetadata = ['document_type', 'archived_by', 'archived_at', 'jurisdiction'];
    const missingMetadata = requiredMetadata.filter(field => !archive[field]);

    if (missingMetadata.length > 0) {
      complianceIssues.push({
        severity: 'medium',
        issue: `Missing required metadata: ${missingMetadata.join(', ')}`,
        recommendation: 'Complete all required metadata fields'
      });
    }

    // Calculate compliance score
    const criticalCount = complianceIssues.filter(i => i.severity === 'critical').length;
    const highCount = complianceIssues.filter(i => i.severity === 'high').length;
    const mediumCount = complianceIssues.filter(i => i.severity === 'medium').length;
    
    let complianceScore = 100;
    complianceScore -= criticalCount * 25;
    complianceScore -= highCount * 15;
    complianceScore -= mediumCount * 5;
    complianceScore = Math.max(0, complianceScore);

    const complianceStatus = complianceScore >= 90 ? 'compliant' :
                            complianceScore >= 70 ? 'warning' :
                            complianceScore >= 50 ? 'non_compliant' :
                            'critical_non_compliant';

    // Update archive with compliance check results
    await supabase
      .from('legal_archives')
      .update({
        compliance_status: complianceStatus,
        compliance_score: complianceScore,
        last_compliance_check: now.toISOString(),
        compliance_issues: complianceIssues
      })
      .eq('id', archive_id);

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        resource_type: 'legal_archive',
        resource_id: archive_id,
        action: 'compliance_check',
        changes: {
          compliance_score: complianceScore,
          compliance_status: complianceStatus,
          issues_found: complianceIssues.length
        }
      });

    // Notify if non-compliant
    if (complianceScore < 70) {
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: archive.archived_by,
          title: 'Compliance Alert',
          message: `Archive document ${archive.document_id} has compliance issues requiring attention`,
          type: 'compliance_alert',
          data: {
            archive_id,
            compliance_score: complianceScore,
            issues_count: complianceIssues.length
          }
        }
      });
    }

    console.log('Compliance check complete:', {
      archive_id,
      compliance_score: complianceScore,
      compliance_status: complianceStatus,
      issues_found: complianceIssues.length
    });

    return new Response(JSON.stringify({
      success: true,
      archive_id,
      compliance_score: complianceScore,
      compliance_status: complianceStatus,
      issues: complianceIssues,
      days_remaining: daysRemaining
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in legal-archive-compliance-check:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
