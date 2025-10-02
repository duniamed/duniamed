-- Clinical Workflows / Care Pathways
CREATE TABLE IF NOT EXISTS public.care_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pathway_type TEXT NOT NULL, -- 'chronic_care', 'post_op', 'high_risk_followup'
  duration_days INTEGER,
  is_template BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.patient_care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  pathway_id UUID REFERENCES public.care_pathways(id),
  specialist_id UUID REFERENCES public.specialists(id) NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id),
  start_date TIMESTAMPTZ DEFAULT now(),
  target_end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'discontinued'
  adherence_score NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.care_plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id UUID REFERENCES public.patient_care_plans(id) ON DELETE CASCADE NOT NULL,
  task_name TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL, -- 'medication', 'lab', 'appointment', 'education', 'lifestyle'
  assigned_to UUID, -- specialist_id
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'overdue'
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  sequence_order INTEGER,
  milestone BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lab and Imaging Orders
CREATE TABLE IF NOT EXISTS public.lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE DEFAULT ('LAB-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')),
  patient_id UUID NOT NULL,
  specialist_id UUID REFERENCES public.specialists(id) NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  order_type TEXT NOT NULL, -- 'lab', 'imaging'
  test_codes TEXT[] NOT NULL,
  test_names TEXT[] NOT NULL,
  priority TEXT DEFAULT 'routine', -- 'routine', 'urgent', 'stat'
  clinical_notes TEXT,
  status TEXT DEFAULT 'ordered', -- 'ordered', 'collected', 'processing', 'resulted', 'cancelled'
  lab_facility TEXT,
  ordered_at TIMESTAMPTZ DEFAULT now(),
  collected_at TIMESTAMPTZ,
  resulted_at TIMESTAMPTZ,
  result_data JSONB,
  result_pdf_url TEXT,
  dicom_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_number TEXT UNIQUE DEFAULT ('REF-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')),
  patient_id UUID NOT NULL,
  from_specialist_id UUID REFERENCES public.specialists(id) NOT NULL,
  to_specialist_id UUID REFERENCES public.specialists(id),
  to_clinic_id UUID REFERENCES public.clinics(id),
  specialty_requested TEXT NOT NULL,
  reason TEXT NOT NULL,
  urgency TEXT DEFAULT 'routine', -- 'routine', 'urgent', 'emergent'
  clinical_summary TEXT,
  diagnosis_codes TEXT[],
  attachments JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'scheduled', 'completed', 'declined'
  accepted_at TIMESTAMPTZ,
  scheduled_appointment_id UUID REFERENCES public.appointments(id),
  completed_at TIMESTAMPTZ,
  decline_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RPM Device Data
CREATE TABLE IF NOT EXISTS public.rpm_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  device_type TEXT NOT NULL, -- 'blood_pressure', 'glucose', 'weight', 'pulse_ox', 'heart_rate'
  device_id TEXT NOT NULL,
  device_name TEXT,
  manufacturer TEXT,
  paired_at TIMESTAMPTZ DEFAULT now(),
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rpm_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.rpm_devices(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID NOT NULL,
  reading_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMPTZ NOT NULL,
  flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rpm_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  specialist_id UUID REFERENCES public.specialists(id) NOT NULL,
  reading_type TEXT NOT NULL,
  min_value NUMERIC,
  max_value NUMERIC,
  alert_recipients JSONB, -- array of user_ids
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cost Estimator
CREATE TABLE IF NOT EXISTS public.service_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id),
  specialist_id UUID REFERENCES public.specialists(id),
  service_code TEXT NOT NULL,
  service_name TEXT NOT NULL,
  base_fee NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payer_id TEXT,
  payer_name TEXT,
  effective_date DATE DEFAULT CURRENT_DATE,
  expires_at DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cost_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID,
  appointment_id UUID REFERENCES public.appointments(id),
  service_codes TEXT[] NOT NULL,
  insurance_plan TEXT,
  estimated_total NUMERIC NOT NULL,
  estimated_patient_responsibility NUMERIC,
  estimated_insurance_payment NUMERIC,
  copay NUMERIC,
  deductible_applied NUMERIC,
  estimate_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Proxy / Caregiver Access
CREATE TABLE IF NOT EXISTS public.proxy_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  proxy_user_id UUID NOT NULL,
  proxy_name TEXT NOT NULL,
  proxy_email TEXT NOT NULL,
  relationship TEXT NOT NULL,
  access_scope JSONB DEFAULT '{"appointments": true, "records": true, "messaging": true, "prescriptions": false}',
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- 'active', 'revoked', 'expired'
  consent_document_url TEXT,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proxy_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authorization_id UUID REFERENCES public.proxy_authorizations(id) ON DELETE CASCADE NOT NULL,
  proxy_user_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  accessed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Patient Community Q&A
CREATE TABLE IF NOT EXISTS public.community_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open', -- 'open', 'answered', 'closed'
  view_count INTEGER DEFAULT 0,
  upvote_count INTEGER DEFAULT 0,
  answer_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.community_questions(id) ON DELETE CASCADE NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  upvote_count INTEGER DEFAULT 0,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clinic Locations (for multi-site)
CREATE TABLE IF NOT EXISTS public.clinic_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  location_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  operating_hours JSONB,
  services_offered TEXT[],
  staff_ids UUID[],
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.care_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpm_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpm_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpm_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proxy_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proxy_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Care Pathways
CREATE POLICY "Clinic staff manage care pathways" ON public.care_pathways
  FOR ALL USING (
    clinic_id IN (SELECT clinic_id FROM public.clinic_staff WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone view active pathway templates" ON public.care_pathways
  FOR SELECT USING (is_template = true AND is_active = true);

-- RLS Policies for Patient Care Plans
CREATE POLICY "Patients view own care plans" ON public.patient_care_plans
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Specialists manage assigned care plans" ON public.patient_care_plans
  FOR ALL USING (
    specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
  );

-- RLS Policies for Care Plan Tasks
CREATE POLICY "Patients view own tasks" ON public.care_plan_tasks
  FOR SELECT USING (
    care_plan_id IN (SELECT id FROM public.patient_care_plans WHERE patient_id = auth.uid())
  );

CREATE POLICY "Specialists manage tasks" ON public.care_plan_tasks
  FOR ALL USING (
    care_plan_id IN (
      SELECT id FROM public.patient_care_plans 
      WHERE specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
    )
  );

-- RLS Policies for Lab Orders
CREATE POLICY "Patients view own lab orders" ON public.lab_orders
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Specialists manage lab orders" ON public.lab_orders
  FOR ALL USING (
    specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
  );

-- RLS Policies for Referrals
CREATE POLICY "Patients view own referrals" ON public.referrals
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Specialists create referrals" ON public.referrals
  FOR INSERT WITH CHECK (
    from_specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
  );

CREATE POLICY "Specialists view relevant referrals" ON public.referrals
  FOR SELECT USING (
    from_specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()) OR
    to_specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
  );

CREATE POLICY "Receiving specialists update referrals" ON public.referrals
  FOR UPDATE USING (
    to_specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
  );

-- RLS Policies for RPM
CREATE POLICY "Patients manage own devices" ON public.rpm_devices
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "Specialists view patient devices" ON public.rpm_devices
  FOR SELECT USING (
    patient_id IN (
      SELECT patient_id FROM public.appointments 
      WHERE specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "System creates readings" ON public.rpm_readings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Patients view own readings" ON public.rpm_readings
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Specialists view patient readings" ON public.rpm_readings
  FOR SELECT USING (
    patient_id IN (
      SELECT patient_id FROM public.appointments 
      WHERE specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Specialists manage thresholds" ON public.rpm_thresholds
  FOR ALL USING (
    specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
  );

-- RLS Policies for Cost Estimator
CREATE POLICY "Clinic staff manage fees" ON public.service_fees
  FOR ALL USING (
    clinic_id IN (SELECT clinic_id FROM public.clinic_staff WHERE user_id = auth.uid()) OR
    specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone view active fees" ON public.service_fees
  FOR SELECT USING (is_active = true);

CREATE POLICY "System creates estimates" ON public.cost_estimates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Patients view own estimates" ON public.cost_estimates
  FOR SELECT USING (patient_id = auth.uid());

-- RLS Policies for Proxy Access
CREATE POLICY "Patients manage own proxies" ON public.proxy_authorizations
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "Proxies view their authorizations" ON public.proxy_authorizations
  FOR SELECT USING (proxy_user_id = auth.uid() AND status = 'active');

CREATE POLICY "System logs proxy access" ON public.proxy_access_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Patients view proxy logs" ON public.proxy_access_logs
  FOR SELECT USING (patient_id = auth.uid());

-- RLS Policies for Community Q&A
CREATE POLICY "Anyone view community questions" ON public.community_questions
  FOR SELECT USING (true);

CREATE POLICY "Users create questions" ON public.community_questions
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors update own questions" ON public.community_questions
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Anyone view answers" ON public.community_answers
  FOR SELECT USING (true);

CREATE POLICY "Users create answers" ON public.community_answers
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors update own answers" ON public.community_answers
  FOR UPDATE USING (author_id = auth.uid());

-- RLS Policies for Clinic Locations
CREATE POLICY "Anyone view active locations" ON public.clinic_locations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Clinic owners manage locations" ON public.clinic_locations
  FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE created_by = auth.uid())
  );

-- Add modality field to appointments if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'appointments' AND column_name = 'modality') THEN
    ALTER TABLE public.appointments ADD COLUMN modality TEXT DEFAULT 'telehealth';
  END IF;
END $$;

-- Add location_id to appointments
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'appointments' AND column_name = 'location_id') THEN
    ALTER TABLE public.appointments ADD COLUMN location_id UUID REFERENCES public.clinic_locations(id);
  END IF;
END $$;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_care_pathways_updated_at BEFORE UPDATE ON public.care_pathways
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_care_plans_updated_at BEFORE UPDATE ON public.patient_care_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_plan_tasks_updated_at BEFORE UPDATE ON public.care_plan_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON public.lab_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rpm_thresholds_updated_at BEFORE UPDATE ON public.rpm_thresholds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_fees_updated_at BEFORE UPDATE ON public.service_fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proxy_authorizations_updated_at BEFORE UPDATE ON public.proxy_authorizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_questions_updated_at BEFORE UPDATE ON public.community_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_answers_updated_at BEFORE UPDATE ON public.community_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinic_locations_updated_at BEFORE UPDATE ON public.clinic_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();