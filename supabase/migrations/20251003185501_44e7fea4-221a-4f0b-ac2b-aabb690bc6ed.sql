-- Clinical Focus Mode and Evening Load Firewall Tables

-- Focus mode preferences per user
CREATE TABLE IF NOT EXISTS focus_mode_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL CHECK (user_role IN ('patient', 'specialist', 'clinic_admin')),
  enabled BOOLEAN DEFAULT true,
  
  -- Panel visibility settings
  hidden_panels JSONB DEFAULT '[]'::jsonb,
  favorite_panels JSONB DEFAULT '[]'::jsonb,
  panel_order JSONB DEFAULT '[]'::jsonb,
  
  -- Clinical display preferences
  show_vitals_summary BOOLEAN DEFAULT true,
  show_recent_labs BOOLEAN DEFAULT true,
  show_active_medications BOOLEAN DEFAULT true,
  show_allergies BOOLEAN DEFAULT true,
  show_problem_list BOOLEAN DEFAULT true,
  show_billing_info BOOLEAN DEFAULT false,
  
  -- Shortcuts and macros
  keyboard_shortcuts JSONB DEFAULT '{}'::jsonb,
  quick_actions JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Message routing rules
CREATE TABLE IF NOT EXISTS message_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Routing configuration
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('urgency', 'topic', 'time', 'skill')),
  priority INTEGER DEFAULT 0,
  
  -- Conditions
  conditions JSONB NOT NULL, -- { "keywords": [], "urgency_level": "", "time_window": "" }
  
  -- Actions
  route_to_pool TEXT, -- 'clinical', 'administrative', 'nursing', 'triage'
  assign_to_role TEXT,
  batch_until TIMESTAMPTZ,
  auto_respond_macro_id UUID,
  escalation_threshold_minutes INTEGER,
  
  -- Quiet hours enforcement
  enforce_quiet_hours BOOLEAN DEFAULT true,
  quiet_hours_start TIME DEFAULT '18:00',
  quiet_hours_end TIME DEFAULT '08:00',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Message batches for deferred processing
CREATE TABLE IF NOT EXISTS message_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  
  batch_type TEXT NOT NULL CHECK (batch_type IN ('routine', 'follow_up', 'administrative')),
  scheduled_process_at TIMESTAMPTZ NOT NULL,
  
  message_ids JSONB DEFAULT '[]'::jsonb,
  assigned_to_pool TEXT,
  assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
  processed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Work queue for pooled tasks
CREATE TABLE IF NOT EXISTS work_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  
  queue_name TEXT NOT NULL,
  queue_type TEXT NOT NULL CHECK (queue_type IN ('clinical', 'administrative', 'nursing', 'triage')),
  
  -- Capacity management
  max_concurrent_items INTEGER DEFAULT 50,
  current_item_count INTEGER DEFAULT 0,
  
  -- Assignment rules
  auto_assign_enabled BOOLEAN DEFAULT true,
  assign_by_skill BOOLEAN DEFAULT true,
  eligible_user_ids JSONB DEFAULT '[]'::jsonb,
  
  -- SLA tracking
  target_response_minutes INTEGER DEFAULT 60,
  target_closure_minutes INTEGER DEFAULT 1440, -- 24 hours
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Work queue items
CREATE TABLE IF NOT EXISTS work_queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES work_queues(id) ON DELETE CASCADE,
  
  -- Item reference
  item_type TEXT NOT NULL CHECK (item_type IN ('message', 'appointment', 'result', 'referral', 'prescription')),
  item_id UUID NOT NULL,
  
  -- Classification
  urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('urgent', 'high', 'routine', 'low')),
  topic TEXT,
  requires_md_review BOOLEAN DEFAULT false,
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'escalated')),
  first_viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Timing metrics
  time_to_first_view_minutes INTEGER,
  time_to_completion_minutes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Evening load metrics
CREATE TABLE IF NOT EXISTS evening_load_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  
  metric_date DATE NOT NULL,
  
  -- Time tracking
  after_hours_minutes INTEGER DEFAULT 0,
  inbox_time_minutes INTEGER DEFAULT 0,
  documentation_time_minutes INTEGER DEFAULT 0,
  
  -- Activity counts
  messages_handled INTEGER DEFAULT 0,
  charts_reviewed INTEGER DEFAULT 0,
  orders_placed INTEGER DEFAULT 0,
  
  -- Inbox health
  inbox_half_life_hours NUMERIC,
  items_closed INTEGER DEFAULT 0,
  items_deferred INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clinical encounter focus sessions
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  
  session_type TEXT DEFAULT 'encounter' CHECK (session_type IN ('encounter', 'chart_review', 'documentation')),
  
  -- Focus mode state
  focus_enabled BOOLEAN DEFAULT true,
  active_panels JSONB DEFAULT '[]'::jsonb,
  hidden_elements JSONB DEFAULT '[]'::jsonb,
  
  -- Interaction tracking
  click_count INTEGER DEFAULT 0,
  navigation_events JSONB DEFAULT '[]'::jsonb,
  time_in_session_seconds INTEGER DEFAULT 0,
  
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Response macros for quick replies
CREATE TABLE IF NOT EXISTS response_macros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  macro_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'prescription_refill', 'test_results', 'scheduling', etc.
  
  -- Content
  subject_template TEXT,
  body_template TEXT NOT NULL,
  requires_customization BOOLEAN DEFAULT false,
  
  -- Variables for personalization
  available_variables JSONB DEFAULT '[]'::jsonb, -- ["patient_name", "appointment_date", etc.]
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_focus_mode_user ON focus_mode_preferences(user_id);
CREATE INDEX idx_message_routing_clinic ON message_routing_rules(clinic_id);
CREATE INDEX idx_message_batches_scheduled ON message_batches(scheduled_process_at, status);
CREATE INDEX idx_work_queues_clinic ON work_queues(clinic_id);
CREATE INDEX idx_work_queue_items_queue ON work_queue_items(queue_id, status);
CREATE INDEX idx_work_queue_items_assigned ON work_queue_items(assigned_to, status);
CREATE INDEX idx_evening_metrics_user_date ON evening_load_metrics(user_id, metric_date);
CREATE INDEX idx_focus_sessions_user ON focus_sessions(user_id, started_at);
CREATE INDEX idx_response_macros_clinic ON response_macros(clinic_id, category);

-- Enable RLS
ALTER TABLE focus_mode_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evening_load_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_macros ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own focus preferences"
  ON focus_mode_preferences FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Clinic admins manage routing rules"
  ON message_routing_rules FOR ALL
  USING (clinic_id IN (
    SELECT id FROM clinics WHERE created_by = auth.uid()
  ));

CREATE POLICY "Clinic staff view routing rules"
  ON message_routing_rules FOR SELECT
  USING (clinic_id IN (
    SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clinic staff manage message batches"
  ON message_batches FOR ALL
  USING (clinic_id IN (
    SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clinic staff manage work queues"
  ON work_queues FOR ALL
  USING (clinic_id IN (
    SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
  ));

CREATE POLICY "Assigned users view queue items"
  ON work_queue_items FOR SELECT
  USING (
    assigned_to = auth.uid() OR
    queue_id IN (
      SELECT id FROM work_queues WHERE clinic_id IN (
        SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Assigned users update queue items"
  ON work_queue_items FOR UPDATE
  USING (assigned_to = auth.uid());

CREATE POLICY "Users view own evening metrics"
  ON evening_load_metrics FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Clinic admins view staff metrics"
  ON evening_load_metrics FOR SELECT
  USING (clinic_id IN (
    SELECT id FROM clinics WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users manage own focus sessions"
  ON focus_sessions FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Clinic staff manage response macros"
  ON response_macros FOR ALL
  USING (clinic_id IN (
    SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
  ));

-- Triggers for updated_at
CREATE TRIGGER update_focus_mode_preferences_updated_at
  BEFORE UPDATE ON focus_mode_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_routing_rules_updated_at
  BEFORE UPDATE ON message_routing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_queues_updated_at
  BEFORE UPDATE ON work_queues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_queue_items_updated_at
  BEFORE UPDATE ON work_queue_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_response_macros_updated_at
  BEFORE UPDATE ON response_macros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();