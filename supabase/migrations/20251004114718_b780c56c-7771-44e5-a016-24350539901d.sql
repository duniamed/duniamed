-- AI Configuration and Governance Schema
-- Phase 1: Core configuration, source registry, audit trails

-- Enum for AI contexts
CREATE TYPE ai_context AS ENUM ('patient', 'clinic', 'internal', 'specialist');

-- Enum for source types
CREATE TYPE ai_source_type AS ENUM ('guideline', 'ontology', 'formulary', 'internal_protocol', 'journal_api', 'fhir_resource');

-- Enum for source status
CREATE TYPE ai_source_status AS ENUM ('approved', 'pending', 'retired', 'under_review');

-- Enum for audit actions
CREATE TYPE ai_audit_action AS ENUM ('create', 'update', 'approve', 'rollback', 'retire', 'deploy');

-- AI Configuration Profiles
CREATE TABLE ai_config_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  context ai_context NOT NULL,
  responsiveness JSONB NOT NULL DEFAULT '{"tone": "empathetic", "verbosity": "balanced", "abstain_policy": "strict"}',
  compliance_layers JSONB NOT NULL DEFAULT '{"HIPAA": true, "LGPD": true, "GDPR": true}',
  data_access_scope JSONB NOT NULL DEFAULT '{"source_whitelist": [], "pii_masking": true}',
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  change_note TEXT
);

-- AI Source Registry
CREATE TABLE ai_source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT NOT NULL UNIQUE,
  source_type ai_source_type NOT NULL,
  name TEXT NOT NULL,
  uri TEXT NOT NULL,
  version TEXT NOT NULL,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE,
  checksum TEXT,
  retrieval_method TEXT DEFAULT 'api',
  status ai_source_status NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Policy Audit (immutable)
CREATE TABLE ai_policy_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES ai_config_profiles(id),
  action ai_audit_action NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  diff JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  justification TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

-- AI Symptom Checker Modules Registry
CREATE TABLE ai_symptom_checker_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL UNIQUE,
  storage_ref TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  owning_team TEXT,
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Symptom Logs (anonymized)
CREATE TABLE ai_symptom_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  context ai_context NOT NULL,
  inputs_hash TEXT NOT NULL,
  inputs_schema JSONB,
  retrieved_sources JSONB NOT NULL DEFAULT '[]',
  output_summary TEXT,
  output_schema JSONB,
  citations JSONB NOT NULL DEFAULT '[]',
  flags JSONB DEFAULT '{}',
  latency_ms INTEGER,
  evaluator_scores JSONB,
  user_role TEXT,
  geo_region TEXT
);

-- AI Sandbox Sessions
CREATE TABLE ai_sandbox_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_by UUID NOT NULL REFERENCES auth.users(id),
  config_version INTEGER,
  config_snapshot JSONB NOT NULL,
  source_scope_snapshot JSONB NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  test_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_ai_config_active ON ai_config_profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_ai_config_context ON ai_config_profiles(context);
CREATE INDEX idx_ai_source_status ON ai_source_registry(status);
CREATE INDEX idx_ai_source_valid ON ai_source_registry(valid_from, valid_to);
CREATE INDEX idx_ai_logs_timestamp ON ai_symptom_logs(timestamp DESC);
CREATE INDEX idx_ai_logs_context ON ai_symptom_logs(context);
CREATE INDEX idx_ai_audit_timestamp ON ai_policy_audit(timestamp DESC);
CREATE INDEX idx_ai_audit_config ON ai_policy_audit(config_id);

-- GIN indexes for JSONB queries
CREATE INDEX idx_ai_logs_sources ON ai_symptom_logs USING GIN(retrieved_sources);
CREATE INDEX idx_ai_logs_citations ON ai_symptom_logs USING GIN(citations);
CREATE INDEX idx_ai_logs_flags ON ai_symptom_logs USING GIN(flags);

-- Enable RLS on all tables
ALTER TABLE ai_config_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_source_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_policy_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_symptom_checker_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_symptom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sandbox_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage AI configuration
CREATE POLICY "Admins can view all AI configs"
  ON ai_config_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create AI configs"
  ON ai_config_profiles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins can update AI configs"
  ON ai_config_profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Source Registry: Admins manage
CREATE POLICY "Admins can view sources"
  ON ai_source_registry FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage sources"
  ON ai_source_registry FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Policy Audit: Read-only for admins, system inserts
CREATE POLICY "Admins can view audit logs"
  ON ai_policy_audit FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create audit logs"
  ON ai_policy_audit FOR INSERT
  WITH CHECK (true);

-- Symptom Checker Modules: Admin read/write
CREATE POLICY "Admins can view modules"
  ON ai_symptom_checker_modules FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage modules"
  ON ai_symptom_checker_modules FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Symptom Logs: Admins and auditors can read
CREATE POLICY "Admins can view symptom logs"
  ON ai_symptom_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert symptom logs"
  ON ai_symptom_logs FOR INSERT
  WITH CHECK (true);

-- Sandbox Sessions: Creator can manage own
CREATE POLICY "Users can view own sandbox sessions"
  ON ai_sandbox_sessions FOR SELECT
  USING (started_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create sandbox sessions"
  ON ai_sandbox_sessions FOR INSERT
  WITH CHECK (started_by = auth.uid());

CREATE POLICY "Users can update own sandbox sessions"
  ON ai_sandbox_sessions FOR UPDATE
  USING (started_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_ai_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_config_profiles_timestamp
  BEFORE UPDATE ON ai_config_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_config_timestamp();

CREATE TRIGGER update_ai_source_registry_timestamp
  BEFORE UPDATE ON ai_source_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_config_timestamp();

-- Function to log config changes to audit
CREATE OR REPLACE FUNCTION log_ai_config_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO ai_policy_audit (config_id, action, actor_id, diff, justification)
    VALUES (
      NEW.id,
      'update'::ai_audit_action,
      auth.uid(),
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)),
      COALESCE(NEW.change_note, 'Configuration updated')
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO ai_policy_audit (config_id, action, actor_id, diff, justification)
    VALUES (
      NEW.id,
      'create'::ai_audit_action,
      auth.uid(),
      jsonb_build_object('new', to_jsonb(NEW)),
      COALESCE(NEW.change_note, 'Configuration created')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_ai_config_changes
  AFTER INSERT OR UPDATE ON ai_config_profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_ai_config_change();

COMMENT ON TABLE ai_config_profiles IS 'Versioned AI configuration profiles for different contexts with compliance controls';
COMMENT ON TABLE ai_source_registry IS 'Approved medical sources and knowledge bases for AI retrieval';
COMMENT ON TABLE ai_policy_audit IS 'Immutable audit log of all AI configuration changes';
COMMENT ON TABLE ai_symptom_logs IS 'Anonymized AI interaction logs for analytics and research';
COMMENT ON TABLE ai_sandbox_sessions IS 'Isolated testing environment for AI configuration validation';