-- Complete Stripe flow tables
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status text NOT NULL,
  plan_id text NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Claims submission tables
CREATE TABLE IF NOT EXISTS insurance_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id uuid NOT NULL,
  specialist_id uuid NOT NULL,
  claim_number text UNIQUE NOT NULL DEFAULT ('CLM-' || lpad((floor(random() * 999999))::text, 6, '0')),
  payer_id text NOT NULL,
  payer_name text NOT NULL,
  service_date timestamptz NOT NULL,
  diagnosis_codes text[] NOT NULL,
  procedure_codes text[] NOT NULL,
  billed_amount numeric NOT NULL,
  allowed_amount numeric,
  paid_amount numeric,
  status text DEFAULT 'draft',
  submission_date timestamptz,
  adjudication_date timestamptz,
  denial_reason text,
  claim_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payer eligibility table
CREATE TABLE IF NOT EXISTS eligibility_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  payer_id text NOT NULL,
  member_id text NOT NULL,
  check_date timestamptz DEFAULT now(),
  is_eligible boolean,
  coverage_details jsonb DEFAULT '{}',
  copay_amount numeric,
  deductible_remaining numeric,
  out_of_pocket_remaining numeric,
  plan_details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Appointment reminders tracking
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  send_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'pending',
  channel text NOT NULL,
  recipient_contact text NOT NULL,
  message_content text,
  created_at timestamptz DEFAULT now()
);

-- Waitlist matching logs
CREATE TABLE IF NOT EXISTS waitlist_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id uuid NOT NULL REFERENCES appointment_waitlist(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  matched_at timestamptz DEFAULT now(),
  notified_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  match_score numeric,
  match_criteria jsonb DEFAULT '{}'
);

-- Calendar sync tokens
CREATE TABLE IF NOT EXISTS calendar_sync_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  token_expiry timestamptz,
  calendar_id text,
  sync_enabled boolean DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Internal team chat
CREATE TABLE IF NOT EXISTS team_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  conversation_type text NOT NULL,
  subject text,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES team_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz,
  is_active boolean DEFAULT true,
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES team_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message_content text NOT NULL,
  attachments jsonb DEFAULT '[]',
  is_urgent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Emergency protocols
CREATE TABLE IF NOT EXISTS emergency_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  protocol_name text NOT NULL,
  protocol_type text NOT NULL,
  trigger_conditions jsonb NOT NULL,
  escalation_steps jsonb NOT NULL,
  contact_list jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid REFERENCES emergency_protocols(id) ON DELETE SET NULL,
  patient_id uuid,
  initiated_by uuid NOT NULL,
  incident_type text NOT NULL,
  severity text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'active',
  escalation_level integer DEFAULT 1,
  notifications_sent jsonb DEFAULT '[]',
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Specialist forums
CREATE TABLE IF NOT EXISTS forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  specialty_tags text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  tags text[],
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  is_solution boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES forum_posts(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id),
  UNIQUE(reply_id, user_id)
);

-- Enable RLS
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own stripe data" ON stripe_customers FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own subscriptions" ON stripe_subscriptions FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Patients view own claims" ON insurance_claims FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Specialists view their claims" ON insurance_claims FOR SELECT USING (specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid()));
CREATE POLICY "Specialists create claims" ON insurance_claims FOR INSERT WITH CHECK (specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid()));

CREATE POLICY "Patients view own eligibility" ON eligibility_checks FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "System creates eligibility checks" ON eligibility_checks FOR INSERT WITH CHECK (true);

CREATE POLICY "Users view own reminders" ON appointment_reminders FOR SELECT USING (appointment_id IN (SELECT id FROM appointments WHERE patient_id = auth.uid() OR specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid())));

CREATE POLICY "Patients view own matches" ON waitlist_matches FOR SELECT USING (waitlist_id IN (SELECT id FROM appointment_waitlist WHERE patient_id = auth.uid()));

CREATE POLICY "Users manage own calendar sync" ON calendar_sync_tokens FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Clinic staff view team conversations" ON team_conversations FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()));
CREATE POLICY "Clinic staff create conversations" ON team_conversations FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Participants view team messages" ON team_messages FOR SELECT USING (conversation_id IN (SELECT conversation_id FROM team_conversation_participants WHERE user_id = auth.uid()));
CREATE POLICY "Participants send messages" ON team_messages FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Clinic staff view protocols" ON emergency_protocols FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()));
CREATE POLICY "Clinic owners manage protocols" ON emergency_protocols FOR ALL USING (clinic_id IN (SELECT id FROM clinics WHERE created_by = auth.uid()));

CREATE POLICY "Clinic staff view incidents" ON emergency_incidents FOR SELECT USING (initiated_by = auth.uid() OR protocol_id IN (SELECT id FROM emergency_protocols WHERE clinic_id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid())));
CREATE POLICY "Clinic staff create incidents" ON emergency_incidents FOR INSERT WITH CHECK (initiated_by = auth.uid());

CREATE POLICY "Everyone views forum categories" ON forum_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Specialists view forum posts" ON forum_posts FOR SELECT USING (author_id IN (SELECT user_id FROM specialists));
CREATE POLICY "Specialists create posts" ON forum_posts FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Specialists view replies" ON forum_replies FOR SELECT USING (true);
CREATE POLICY "Specialists create replies" ON forum_replies FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Specialists manage votes" ON forum_votes FOR ALL USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_insurance_claims_patient ON insurance_claims(patient_id);
CREATE INDEX idx_insurance_claims_specialist ON insurance_claims(specialist_id);
CREATE INDEX idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX idx_appointment_reminders_send_at ON appointment_reminders(send_at, status);
CREATE INDEX idx_team_messages_conversation ON team_messages(conversation_id, created_at);
CREATE INDEX idx_forum_posts_category ON forum_posts(category_id, created_at);
CREATE INDEX idx_emergency_incidents_status ON emergency_incidents(status, created_at);