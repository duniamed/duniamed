-- Add token refresh tracking and health monitoring
ALTER TABLE calendar_providers ADD COLUMN IF NOT EXISTS refresh_count INTEGER DEFAULT 0;
ALTER TABLE calendar_providers ADD COLUMN IF NOT EXISTS failure_count INTEGER DEFAULT 0;
ALTER TABLE calendar_providers ADD COLUMN IF NOT EXISTS last_refresh_attempt TIMESTAMP WITH TIME ZONE;

-- Calendar sync logs for monitoring
CREATE TABLE IF NOT EXISTS calendar_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sync logs"
  ON calendar_sync_logs FOR SELECT
  USING (user_id = auth.uid());

-- Resource inventory for constraint solving
CREATE TABLE IF NOT EXISTS clinic_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  location_id UUID REFERENCES clinic_locations(id),
  capacity INTEGER DEFAULT 1,
  properties JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Resource bookings for constraint solving
CREATE TABLE IF NOT EXISTS resource_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES clinic_resources(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on resources
ALTER TABLE clinic_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff manage resources"
  ON clinic_resources FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff view resource bookings"
  ON resource_bookings FOR SELECT
  USING (resource_id IN (
    SELECT cr.id FROM clinic_resources cr
    JOIN clinic_staff cs ON cs.clinic_id = cr.clinic_id
    WHERE cs.user_id = auth.uid()
  ));

-- Revenue splits for group practice
CREATE TABLE IF NOT EXISTS revenue_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),
  service_type TEXT NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  clinic_percentage NUMERIC(5,2) DEFAULT 30.00,
  specialist_percentage NUMERIC(5,2) DEFAULT 70.00,
  clinic_amount NUMERIC(10,2) NOT NULL,
  specialist_amount NUMERIC(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS specialist_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  appointments_completed INTEGER DEFAULT 0,
  appointments_cancelled INTEGER DEFAULT 0,
  no_show_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2),
  total_revenue NUMERIC(10,2) DEFAULT 0,
  patient_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(specialist_id, clinic_id, period_start)
);

-- Enable RLS
ALTER TABLE revenue_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic admins view revenue splits"
  ON revenue_splits FOR SELECT
  USING (clinic_id IN (SELECT id FROM clinics WHERE created_by = auth.uid()));

CREATE POLICY "Specialists view own revenue"
  ON revenue_splits FOR SELECT
  USING (specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid()));

CREATE POLICY "Clinic staff view performance"
  ON specialist_performance_metrics FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()));

CREATE POLICY "Specialists view own performance"
  ON specialist_performance_metrics FOR SELECT
  USING (specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid()));

-- Professional endorsements
CREATE TABLE IF NOT EXISTS professional_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id UUID NOT NULL,
  endorsed_id UUID REFERENCES specialists(id) ON DELETE CASCADE,
  skill_category TEXT NOT NULL,
  endorsement_text TEXT,
  relationship_type TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(endorser_id, endorsed_id, skill_category)
);

-- Job postings
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  specialty_required TEXT[],
  experience_level TEXT,
  employment_type TEXT,
  salary_range_min NUMERIC(10,2),
  salary_range_max NUMERIC(10,2),
  location_id UUID REFERENCES clinic_locations(id),
  is_active BOOLEAN DEFAULT true,
  posted_by UUID NOT NULL,
  application_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE professional_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view endorsements"
  ON professional_endorsements FOR SELECT
  USING (true);

CREATE POLICY "Specialists create endorsements"
  ON professional_endorsements FOR INSERT
  WITH CHECK (endorser_id = auth.uid());

CREATE POLICY "Anyone view active jobs"
  ON job_postings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Clinic admins manage jobs"
  ON job_postings FOR ALL
  USING (clinic_id IN (SELECT id FROM clinics WHERE created_by = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_user ON calendar_sync_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resource_bookings_time ON resource_bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_revenue_splits_specialist ON revenue_splits(specialist_id, period_start);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_specialist ON specialist_performance_metrics(specialist_id, period_start);
CREATE INDEX IF NOT EXISTS idx_endorsements_endorsed ON professional_endorsements(endorsed_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_active ON job_postings(clinic_id, is_active, created_at DESC);