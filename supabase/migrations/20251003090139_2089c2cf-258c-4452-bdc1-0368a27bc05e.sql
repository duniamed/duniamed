-- C5 Anti-ghosting: Post-visit confirmation and disputes
CREATE TABLE IF NOT EXISTS visit_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_confirmed BOOLEAN DEFAULT false,
  patient_confirmed_at TIMESTAMP WITH TIME ZONE,
  patient_signature TEXT,
  specialist_confirmed BOOLEAN DEFAULT false,
  specialist_confirmed_at TIMESTAMP WITH TIME ZONE,
  specialist_signature TEXT,
  service_delivered BOOLEAN,
  dispute_opened BOOLEAN DEFAULT false,
  dispute_reason TEXT,
  dispute_opened_at TIMESTAMP WITH TIME ZONE,
  dispute_evidence JSONB DEFAULT '[]'::jsonb,
  dispute_resolved_at TIMESTAMP WITH TIME ZONE,
  dispute_resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE visit_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own visit confirmations"
  ON visit_confirmations FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM appointments 
      WHERE patient_id = auth.uid() 
      OR specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Patients confirm visits"
  ON visit_confirmations FOR UPDATE
  USING (
    appointment_id IN (SELECT id FROM appointments WHERE patient_id = auth.uid())
  );

CREATE POLICY "Specialists confirm visits"
  ON visit_confirmations FOR UPDATE
  USING (
    appointment_id IN (
      SELECT id FROM appointments 
      WHERE specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "System creates confirmations"
  ON visit_confirmations FOR INSERT
  WITH CHECK (true);

-- C7 Support: Ticket system
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE DEFAULT 'TKT-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  sla_deadline TIMESTAMP WITH TIME ZONE,
  escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMP WITH TIME ZONE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  rating_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tickets"
  ON support_tickets FOR SELECT
  USING (user_id = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Users create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own tickets"
  ON support_tickets FOR UPDATE
  USING (user_id = auth.uid() OR assigned_to = auth.uid());

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  is_staff BOOLEAN DEFAULT false,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view ticket messages"
  ON support_ticket_messages FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets 
      WHERE user_id = auth.uid() OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users send ticket messages"
  ON support_ticket_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- C10 Procedures: Procedure catalogs and Q&A
CREATE TABLE IF NOT EXISTS procedure_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  average_duration INTEGER,
  typical_cost_range JSONB,
  symptoms_treated TEXT[],
  contraindications TEXT[],
  preparation_required TEXT,
  recovery_time TEXT,
  success_rate NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE procedure_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view procedures"
  ON procedure_catalog FOR SELECT
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS specialist_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES procedure_catalog(id) ON DELETE CASCADE,
  experience_years INTEGER,
  cases_performed INTEGER,
  last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verification_documents JSONB DEFAULT '[]'::jsonb,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(specialist_id, procedure_id)
);

ALTER TABLE specialist_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view specialist procedures"
  ON specialist_procedures FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Specialists manage own procedures"
  ON specialist_procedures FOR ALL
  USING (specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS procedure_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID REFERENCES procedure_catalog(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  question TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE procedure_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view procedure questions"
  ON procedure_questions FOR SELECT
  USING (true);

CREATE POLICY "Patients create questions"
  ON procedure_questions FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE TABLE IF NOT EXISTS procedure_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES procedure_questions(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE procedure_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view answers"
  ON procedure_answers FOR SELECT
  USING (true);

CREATE POLICY "Specialists create answers"
  ON procedure_answers FOR INSERT
  WITH CHECK (specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid()));

-- C8 Transparency: Verification tracking
CREATE TABLE IF NOT EXISTS credential_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL,
  verified_by TEXT NOT NULL,
  verification_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  verification_document_url TEXT,
  is_active BOOLEAN DEFAULT true,
  audit_trail JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE credential_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view active verifications"
  ON credential_verifications FOR SELECT
  USING (is_active = true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_visit_confirmations_timestamp
  BEFORE UPDATE ON visit_confirmations
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_support_tickets_timestamp
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_procedure_catalog_timestamp
  BEFORE UPDATE ON procedure_catalog
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_procedure_questions_timestamp
  BEFORE UPDATE ON procedure_questions
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_procedure_answers_timestamp
  BEFORE UPDATE ON procedure_answers
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();