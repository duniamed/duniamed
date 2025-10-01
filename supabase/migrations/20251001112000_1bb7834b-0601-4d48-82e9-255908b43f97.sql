-- Create document_shares table for cross-border document exchange
CREATE TABLE IF NOT EXISTS document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL, -- patient who owns the document
  shared_with uuid NOT NULL, -- specialist receiving access
  purpose text NOT NULL,
  consent_given boolean NOT NULL DEFAULT false,
  consent_given_at timestamptz,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_by uuid,
  last_accessed_at timestamptz,
  access_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- Patients can create shares for their own documents
CREATE POLICY "Patients can create document shares"
  ON document_shares FOR INSERT
  WITH CHECK (
    shared_by = auth.uid() AND
    consent_given = true AND
    document_id IN (
      SELECT id FROM medical_records WHERE patient_id = auth.uid()
    )
  );

-- Patients can view their own shares
CREATE POLICY "Patients can view own document shares"
  ON document_shares FOR SELECT
  USING (shared_by = auth.uid());

-- Specialists can view shares granted to them
CREATE POLICY "Specialists can view shares granted to them"
  ON document_shares FOR SELECT
  USING (
    shared_with IN (
      SELECT id FROM specialists WHERE user_id = auth.uid()
    ) AND
    revoked_at IS NULL AND
    expires_at > now()
  );

-- Patients can revoke shares
CREATE POLICY "Patients can revoke document shares"
  ON document_shares FOR UPDATE
  USING (shared_by = auth.uid())
  WITH CHECK (shared_by = auth.uid());

-- Create indexes
CREATE INDEX idx_document_shares_shared_with ON document_shares(shared_with) WHERE revoked_at IS NULL;
CREATE INDEX idx_document_shares_expires_at ON document_shares(expires_at) WHERE revoked_at IS NULL;
CREATE INDEX idx_document_shares_document_id ON document_shares(document_id);

-- Create trigger for updated_at
CREATE TRIGGER update_document_shares_updated_at
  BEFORE UPDATE ON document_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create document_access_logs table for audit trail
CREATE TABLE IF NOT EXISTS document_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  accessed_by uuid NOT NULL,
  access_type text NOT NULL, -- 'view', 'download', 'print'
  share_id uuid REFERENCES document_shares(id),
  ip_address text,
  user_agent text,
  accessed_at timestamptz DEFAULT now()
);

-- Enable RLS on access logs
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;

-- Patients can view access logs for their documents
CREATE POLICY "Patients can view own document access logs"
  ON document_access_logs FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM medical_records WHERE patient_id = auth.uid()
    )
  );

-- System can insert access logs
CREATE POLICY "System can create access logs"
  ON document_access_logs FOR INSERT
  WITH CHECK (true);

-- Create indexes for access logs
CREATE INDEX idx_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX idx_access_logs_accessed_by ON document_access_logs(accessed_by);
CREATE INDEX idx_access_logs_accessed_at ON document_access_logs(accessed_at DESC);