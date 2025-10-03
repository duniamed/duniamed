-- Appointment templates for standardization
CREATE TABLE IF NOT EXISTS appointment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  appointment_type TEXT NOT NULL,
  required_resources JSONB DEFAULT '[]',
  required_staff_roles JSONB DEFAULT '[]',
  required_equipment JSONB DEFAULT '[]',
  preparation_instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Practitioner template assignments
CREATE TABLE IF NOT EXISTS practitioner_template_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE,
  template_id UUID REFERENCES appointment_templates(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(specialist_id, template_id, day_of_week, start_time)
);

-- Capacity metrics tracking
CREATE TABLE IF NOT EXISTS capacity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  location_id UUID REFERENCES clinic_locations(id),
  resource_type TEXT NOT NULL,
  resource_id UUID,
  date DATE NOT NULL,
  total_capacity_minutes INTEGER NOT NULL,
  utilized_minutes INTEGER DEFAULT 0,
  utilization_percentage NUMERIC(5,2) DEFAULT 0,
  appointment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(clinic_id, location_id, resource_type, resource_id, date)
);

-- Search preferences and constraints
CREATE TABLE IF NOT EXISTS patient_search_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  max_distance_miles INTEGER DEFAULT 10,
  preferred_languages TEXT[],
  preferred_gender TEXT,
  accessibility_requirements JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(patient_id)
);

-- Appointment booking attempts for analytics
CREATE TABLE IF NOT EXISTS booking_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID,
  specialty TEXT NOT NULL,
  search_criteria JSONB NOT NULL,
  results_count INTEGER DEFAULT 0,
  selected_specialist_id UUID,
  booked BOOLEAN DEFAULT false,
  booking_id UUID REFERENCES appointments(id),
  constraints_relaxed JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Compliance rules
CREATE TABLE IF NOT EXISTS appointment_compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  condition_criteria JSONB NOT NULL,
  action_required JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE appointment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioner_template_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_search_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_compliance_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clinic admins manage templates"
  ON appointment_templates FOR ALL
  USING (clinic_id IN (SELECT id FROM clinics WHERE created_by = auth.uid()));

CREATE POLICY "Specialists view templates"
  ON appointment_templates FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()));

CREATE POLICY "Specialists manage own template availability"
  ON practitioner_template_availability FOR ALL
  USING (specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid()));

CREATE POLICY "Clinic staff view capacity metrics"
  ON capacity_metrics FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()));

CREATE POLICY "Patients manage own preferences"
  ON patient_search_preferences FOR ALL
  USING (patient_id = auth.uid());

CREATE POLICY "Patients view own booking attempts"
  ON booking_attempts FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Clinic admins manage compliance rules"
  ON appointment_compliance_rules FOR ALL
  USING (clinic_id IN (SELECT id FROM clinics WHERE created_by = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_templates_clinic ON appointment_templates(clinic_id, is_active);
CREATE INDEX IF NOT EXISTS idx_practitioner_templates ON practitioner_template_availability(specialist_id, is_active);
CREATE INDEX IF NOT EXISTS idx_capacity_date ON capacity_metrics(clinic_id, date, resource_type);
CREATE INDEX IF NOT EXISTS idx_booking_attempts_patient ON booking_attempts(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_clinic ON appointment_compliance_rules(clinic_id, is_active, priority);