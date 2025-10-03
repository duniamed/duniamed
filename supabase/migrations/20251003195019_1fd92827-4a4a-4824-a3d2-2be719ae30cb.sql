-- Missing tables for claimed features (Phase 1: Core compliance tables)

-- 1. EHDS Compliance Logs (EU)
CREATE TABLE IF NOT EXISTS ehds_compliance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  resource_type text,
  resource_id uuid,
  access_purpose text,
  legal_basis text,
  granted boolean DEFAULT false,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ehds_logs_user ON ehds_compliance_logs(user_id, created_at DESC);
CREATE INDEX idx_ehds_logs_resource ON ehds_compliance_logs(resource_type, resource_id);

ALTER TABLE ehds_compliance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own compliance logs"
ON ehds_compliance_logs FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 2. Medicare/Medicaid Claims (USA)
CREATE TABLE IF NOT EXISTS medicare_medicaid_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id),
  appointment_id uuid REFERENCES appointments(id),
  claim_type text NOT NULL CHECK (claim_type IN ('medicare_part_a', 'medicare_part_b', 'medicare_part_d', 'medicaid')),
  claim_number text UNIQUE,
  billing_provider text,
  rendering_provider uuid REFERENCES specialists(id),
  service_date date NOT NULL,
  diagnosis_codes jsonb DEFAULT '[]'::jsonb,
  procedure_codes jsonb DEFAULT '[]'::jsonb,
  total_charge numeric(10,2),
  medicare_paid numeric(10,2),
  patient_responsibility numeric(10,2),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'processing', 'approved', 'denied', 'appealed')),
  denial_reason text,
  submission_date timestamptz,
  processed_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_medicare_patient ON medicare_medicaid_claims(patient_id, service_date DESC);
CREATE INDEX idx_medicare_clinic ON medicare_medicaid_claims(clinic_id, status);
CREATE INDEX idx_medicare_status ON medicare_medicaid_claims(status, submission_date);

ALTER TABLE medicare_medicaid_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view own medicare claims"
ON medicare_medicaid_claims FOR SELECT TO authenticated
USING (patient_id = auth.uid());

CREATE POLICY "Clinic staff view clinic medicare claims"
ON medicare_medicaid_claims FOR SELECT TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
  )
);

-- 3. PDMP Queries (USA Drug Monitoring)
CREATE TABLE IF NOT EXISTS pdmp_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialist_id uuid NOT NULL REFERENCES specialists(id),
  query_reason text NOT NULL,
  state_queried text NOT NULL,
  prescription_history jsonb,
  red_flags jsonb DEFAULT '[]'::jsonb,
  queried_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

CREATE INDEX idx_pdmp_patient ON pdmp_queries(patient_id, queried_at DESC);
CREATE INDEX idx_pdmp_specialist ON pdmp_queries(specialist_id, queried_at DESC);

ALTER TABLE pdmp_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Specialists view own pdmp queries"
ON pdmp_queries FOR ALL TO authenticated
USING (
  specialist_id IN (
    SELECT id FROM specialists WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  specialist_id IN (
    SELECT id FROM specialists WHERE user_id = auth.uid()
  )
);

-- 4. PIX Transactions (Brazil)
CREATE TABLE IF NOT EXISTS pix_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id),
  pix_key text NOT NULL,
  pix_key_type text NOT NULL CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'BRL',
  transaction_id text UNIQUE,
  qr_code text,
  qr_code_image_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method text DEFAULT 'pix',
  payer_name text,
  payer_document text,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '30 minutes')
);

CREATE INDEX idx_pix_user ON pix_transactions(user_id, created_at DESC);
CREATE INDEX idx_pix_status ON pix_transactions(status, created_at DESC);
CREATE INDEX idx_pix_transaction ON pix_transactions(transaction_id);

ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pix transactions"
ON pix_transactions FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. TISS Submissions (Brazil Health Insurance)
CREATE TABLE IF NOT EXISTS tiss_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES profiles(id),
  appointment_id uuid REFERENCES appointments(id),
  insurance_provider text NOT NULL,
  ans_code text,
  submission_type text NOT NULL CHECK (submission_type IN ('consultation', 'exam', 'procedure', 'hospitalization')),
  tiss_version text DEFAULT '4.0',
  xml_payload text,
  submission_number text UNIQUE,
  batch_number text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'processing', 'approved', 'rejected', 'cancelled')),
  rejection_reason text,
  submitted_at timestamptz,
  processed_at timestamptz,
  amount_requested numeric(10,2),
  amount_approved numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tiss_clinic ON tiss_submissions(clinic_id, status);
CREATE INDEX idx_tiss_patient ON tiss_submissions(patient_id, created_at DESC);
CREATE INDEX idx_tiss_status ON tiss_submissions(status, submitted_at);

ALTER TABLE tiss_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff manage tiss submissions"
ON tiss_submissions FOR ALL TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Patients view own tiss submissions"
ON tiss_submissions FOR SELECT TO authenticated
USING (patient_id = auth.uid());

-- 6. SEPA Mandates (EU Direct Debit)
CREATE TABLE IF NOT EXISTS sepa_mandates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id),
  mandate_reference text UNIQUE NOT NULL,
  creditor_identifier text NOT NULL,
  debtor_name text NOT NULL,
  debtor_iban text NOT NULL,
  debtor_bic text,
  mandate_type text DEFAULT 'recurrent' CHECK (mandate_type IN ('one_off', 'recurrent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  signature_date date,
  activation_date date,
  cancellation_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sepa_user ON sepa_mandates(user_id, status);
CREATE INDEX idx_sepa_clinic ON sepa_mandates(clinic_id, status);
CREATE INDEX idx_sepa_mandate ON sepa_mandates(mandate_reference);

ALTER TABLE sepa_mandates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sepa mandates"
ON sepa_mandates FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Update timestamp triggers
CREATE TRIGGER update_medicare_medicaid_claims_updated_at
  BEFORE UPDATE ON medicare_medicaid_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_tiss_submissions_updated_at
  BEFORE UPDATE ON tiss_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_sepa_mandates_updated_at
  BEFORE UPDATE ON sepa_mandates
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();