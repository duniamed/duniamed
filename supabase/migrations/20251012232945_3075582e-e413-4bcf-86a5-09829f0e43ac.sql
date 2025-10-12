-- Phase 1: Unified Patient Intelligence Hub - Database Schema

-- Patient identifiers table for multi-jurisdiction support
CREATE TABLE IF NOT EXISTS public.patient_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('cpf', 'ssn', 'nhs', 'cpr', 'health_card', 'passport', 'national_id')),
  identifier_value TEXT NOT NULL,
  country_code TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier_type, identifier_value, country_code)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_patient_identifiers_value ON public.patient_identifiers(identifier_value);
CREATE INDEX IF NOT EXISTS idx_patient_identifiers_patient ON public.patient_identifiers(patient_id);

-- Enable RLS
ALTER TABLE public.patient_identifiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_identifiers
CREATE POLICY "Users can view own identifiers"
  ON public.patient_identifiers
  FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Users can insert own identifiers"
  ON public.patient_identifiers
  FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Specialists can view patient identifiers"
  ON public.patient_identifiers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patient_identifiers.patient_id
        AND a.specialist_id IN (
          SELECT id FROM public.specialists WHERE user_id = auth.uid()
        )
    )
  );

-- Unified patient medical summary (cached view for performance)
CREATE TABLE IF NOT EXISTS public.patient_medical_summary (
  patient_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_medications JSONB DEFAULT '[]'::jsonb,
  allergies JSONB DEFAULT '[]'::jsonb,
  chronic_conditions JSONB DEFAULT '[]'::jsonb,
  insurance_status JSONB,
  last_appointment_date TIMESTAMPTZ,
  total_appointments INTEGER DEFAULT 0,
  last_prescription_date TIMESTAMPTZ,
  has_active_prescriptions BOOLEAN DEFAULT false,
  recent_diagnoses JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.patient_medical_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_medical_summary
CREATE POLICY "Users can view own medical summary"
  ON public.patient_medical_summary
  FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Users can update own medical summary"
  ON public.patient_medical_summary
  FOR UPDATE
  USING (patient_id = auth.uid());

CREATE POLICY "Users can insert own medical summary"
  ON public.patient_medical_summary
  FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Specialists can view patient medical summary"
  ON public.patient_medical_summary
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patient_medical_summary.patient_id
        AND a.specialist_id IN (
          SELECT id FROM public.specialists WHERE user_id = auth.uid()
        )
    )
  );

-- Function to refresh patient medical summary
CREATE OR REPLACE FUNCTION public.refresh_patient_medical_summary(p_patient_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.patient_medical_summary (
    patient_id,
    last_appointment_date,
    total_appointments,
    last_prescription_date,
    has_active_prescriptions
  )
  VALUES (
    p_patient_id,
    (SELECT MAX(scheduled_at) FROM appointments WHERE patient_id = p_patient_id),
    (SELECT COUNT(*) FROM appointments WHERE patient_id = p_patient_id),
    (SELECT MAX(created_at) FROM prescriptions WHERE patient_id = p_patient_id),
    (SELECT EXISTS(SELECT 1 FROM prescriptions WHERE patient_id = p_patient_id AND status = 'active'))
  )
  ON CONFLICT (patient_id) DO UPDATE SET
    last_appointment_date = EXCLUDED.last_appointment_date,
    total_appointments = EXCLUDED.total_appointments,
    last_prescription_date = EXCLUDED.last_prescription_date,
    has_active_prescriptions = EXCLUDED.has_active_prescriptions,
    last_updated = NOW();
END;
$$;

-- Trigger to auto-update medical summary when appointment is created
CREATE OR REPLACE FUNCTION public.sync_appointment_to_medical_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM refresh_patient_medical_summary(NEW.patient_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER appointment_medical_summary_sync
AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.sync_appointment_to_medical_summary();