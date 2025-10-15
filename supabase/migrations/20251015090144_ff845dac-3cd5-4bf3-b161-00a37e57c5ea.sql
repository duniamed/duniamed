-- AI Configuration and Governance System
-- Tables for admin AI control, source management, logging, and compliance

-- AI Configuration Profiles
CREATE TABLE IF NOT EXISTS public.ai_config_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  context TEXT NOT NULL CHECK (context IN ('patient', 'clinic', 'internal')),
  responsiveness JSONB NOT NULL DEFAULT '{"tone": "empathetic", "verbosity": "moderate", "abstain_policy": "strict"}',
  compliance_layers JSONB NOT NULL DEFAULT '{"HIPAA": true, "LGPD": true}',
  data_access_scope JSONB NOT NULL DEFAULT '{"source_whitelist": [], "pii_masking": true}',
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  change_note TEXT
);

-- AI Source Registry
CREATE TABLE IF NOT EXISTS public.ai_source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('guideline', 'ontology', 'formulary', 'internal_protocol', 'journal_api')),
  uri TEXT NOT NULL,
  version TEXT NOT NULL,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE,
  checksum TEXT,
  retrieval_method TEXT NOT NULL CHECK (retrieval_method IN ('vectordb', 'bm25', 'hybrid', 'api')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Policy Audit
CREATE TABLE IF NOT EXISTS public.ai_policy_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES public.ai_config_profiles(id),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'approve', 'rollback', 'retire')),
  actor_id UUID REFERENCES auth.users(id),
  diff JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  justification TEXT
);

-- AI Symptom Checker Modules
CREATE TABLE IF NOT EXISTS public.ai_symptom_checker_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT UNIQUE NOT NULL,
  storage_ref TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'testing')),
  owning_team TEXT,
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Symptom Logs (anonymized)
CREATE TABLE IF NOT EXISTS public.ai_symptom_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  context TEXT NOT NULL CHECK (context IN ('patient', 'clinic', 'internal')),
  inputs_hash TEXT NOT NULL,
  inputs_schema JSONB,
  retrieved_sources JSONB DEFAULT '[]',
  output_summary TEXT,
  output_schema JSONB,
  citations JSONB DEFAULT '[]',
  flags JSONB DEFAULT '{}',
  latency_ms INTEGER,
  evaluator_scores JSONB,
  user_role TEXT CHECK (user_role IN ('patient', 'clinician', 'staff')),
  geo_region TEXT
);

-- AI Sandbox Sessions
CREATE TABLE IF NOT EXISTS public.ai_sandbox_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_by UUID REFERENCES auth.users(id),
  config_version INTEGER,
  source_scope_snapshot JSONB,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'concluded', 'discarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_symptom_logs_timestamp ON public.ai_symptom_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_symptom_logs_context ON public.ai_symptom_logs(context);
CREATE INDEX IF NOT EXISTS idx_ai_symptom_logs_request_id ON public.ai_symptom_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_policy_audit_timestamp ON public.ai_policy_audit(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_policy_audit_config_id ON public.ai_policy_audit(config_id);
CREATE INDEX IF NOT EXISTS idx_ai_source_registry_status ON public.ai_source_registry(status);

-- Enable RLS
ALTER TABLE public.ai_config_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_source_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_policy_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_symptom_checker_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_symptom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sandbox_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin-only access)
CREATE POLICY "Admin full access to ai_config_profiles"
  ON public.ai_config_profiles
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to ai_source_registry"
  ON public.ai_source_registry
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin and auditors can view ai_policy_audit"
  ON public.ai_policy_audit
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert ai_policy_audit"
  ON public.ai_policy_audit
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to ai_symptom_checker_modules"
  ON public.ai_symptom_checker_modules
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to ai_symptom_logs"
  ON public.ai_symptom_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to ai_sandbox_sessions"
  ON public.ai_sandbox_sessions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_ai_config_profiles_updated_at
  BEFORE UPDATE ON public.ai_config_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_source_registry_updated_at
  BEFORE UPDATE ON public.ai_source_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_symptom_checker_modules_updated_at
  BEFORE UPDATE ON public.ai_symptom_checker_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();