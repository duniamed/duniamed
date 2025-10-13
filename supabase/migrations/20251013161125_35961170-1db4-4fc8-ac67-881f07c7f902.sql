-- Missing tables for complete implementation
-- Unlimited Edge Function Capacities: No limits on invocations, processing, or resources

-- 1. Staff Invitations (for inverted onboarding flow)
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('specialist', 'admin', 'staff', 'nurse')),
  invite_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_staff_invitations_email ON public.staff_invitations(email);
CREATE INDEX idx_staff_invitations_token ON public.staff_invitations(invite_token);
CREATE INDEX idx_staff_invitations_clinic ON public.staff_invitations(clinic_id);

-- 2. QR Profile Exports (for portability tracking)
CREATE TABLE IF NOT EXISTS public.qr_profile_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  export_type TEXT NOT NULL CHECK (export_type IN ('patient_full', 'specialist_credentials', 'clinic_data', 'waitlist_spot', 'prescription', 'health_record')),
  qr_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  encrypted_payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  scanned_at TIMESTAMPTZ,
  scanned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_qr_exports_token ON public.qr_profile_exports(qr_token);
CREATE INDEX idx_qr_exports_user ON public.qr_profile_exports(user_id);

-- 3. Temporary Prescription Emails (for external platform integration)
CREATE TABLE IF NOT EXISTS public.temp_prescription_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  temp_email TEXT UNIQUE NOT NULL,
  qr_code_data TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_received_at TIMESTAMPTZ
);

CREATE INDEX idx_temp_prescription_emails_patient ON public.temp_prescription_emails(patient_id);
CREATE INDEX idx_temp_prescription_emails_email ON public.temp_prescription_emails(temp_email);

-- 4. Health Record Share Requests (for request/approval flux)
CREATE TABLE IF NOT EXISTS public.health_record_share_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES auth.users(id) NOT NULL,
  requester_type TEXT NOT NULL CHECK (requester_type IN ('specialist', 'clinic')),
  requested_records TEXT[] NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  access_granted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_health_record_requests_patient ON public.health_record_share_requests(patient_id);
CREATE INDEX idx_health_record_requests_requester ON public.health_record_share_requests(requester_id);

-- 5. Analytics Insights AI (for AI-generated insights storage)
CREATE TABLE IF NOT EXISTS public.analytics_insights_ai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('clinic', 'specialist', 'patient', 'platform')),
  entity_id UUID NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('performance', 'prediction', 'recommendation', 'alert', 'trend')),
  insight_text TEXT NOT NULL,
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  data_snapshot JSONB NOT NULL,
  actionable_items JSONB DEFAULT '[]'::jsonb,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_analytics_insights_entity ON public.analytics_insights_ai(entity_type, entity_id);
CREATE INDEX idx_analytics_insights_type ON public.analytics_insights_ai(insight_type);

-- 6. Add missing columns to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS auto_inserted_from_symptom_checker BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_inserted_from_voice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_urgency_score NUMERIC(3,2) CHECK (ai_urgency_score >= 0 AND ai_urgency_score <= 1),
ADD COLUMN IF NOT EXISTS voice_notes_url TEXT,
ADD COLUMN IF NOT EXISTS qr_share_token TEXT UNIQUE;

-- 7. Add payment tracking columns
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('per_booking_fee', 'subscription', 'insurance', 'out_of_pocket', 'hsa_fsa')),
ADD COLUMN IF NOT EXISTS installment_plan_id UUID,
ADD COLUMN IF NOT EXISTS voice_billing_requested BOOLEAN DEFAULT false;

-- 8. Enable RLS on new tables
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_profile_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temp_prescription_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_record_share_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_insights_ai ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for staff_invitations
CREATE POLICY "Clinic admins manage invitations"
ON public.staff_invitations
FOR ALL
USING (
  clinic_id IN (
    SELECT id FROM public.clinics WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Invitees can view own invitations"
ON public.staff_invitations
FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 10. RLS Policies for qr_profile_exports
CREATE POLICY "Users manage own QR exports"
ON public.qr_profile_exports
FOR ALL
USING (user_id = auth.uid());

-- 11. RLS Policies for temp_prescription_emails
CREATE POLICY "Patients manage own temp emails"
ON public.temp_prescription_emails
FOR ALL
USING (patient_id = auth.uid());

-- 12. RLS Policies for health_record_share_requests
CREATE POLICY "Patients manage own share requests"
ON public.health_record_share_requests
FOR ALL
USING (patient_id = auth.uid());

CREATE POLICY "Requesters view their requests"
ON public.health_record_share_requests
FOR SELECT
USING (requester_id = auth.uid());

-- 13. RLS Policies for analytics_insights_ai
CREATE POLICY "Users view own insights"
ON public.analytics_insights_ai
FOR SELECT
USING (
  (entity_type = 'patient' AND entity_id = auth.uid())
  OR (entity_type = 'specialist' AND entity_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()))
  OR (entity_type = 'clinic' AND entity_id IN (SELECT id FROM public.clinics WHERE created_by = auth.uid()))
  OR has_role(auth.uid(), 'admin')
);

-- 14. Functions for auto-waitlist insertion
CREATE OR REPLACE FUNCTION public.auto_insert_waitlist_from_symptom_checker()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If AI urgency score is high (>0.7), auto-add to waitlist
  IF NEW.ai_urgency_score > 0.7 AND NEW.auto_inserted_from_symptom_checker = true THEN
    INSERT INTO public.appointment_waitlist (
      patient_id,
      specialist_id,
      status,
      notes,
      created_at
    )
    SELECT 
      NEW.patient_id,
      NEW.specialist_id,
      'waiting',
      'Auto-inserted from symptom checker - high urgency',
      now()
    WHERE NOT EXISTS (
      SELECT 1 FROM public.appointment_waitlist
      WHERE patient_id = NEW.patient_id 
      AND specialist_id = NEW.specialist_id
      AND status = 'waiting'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Trigger for auto-waitlist
CREATE TRIGGER trigger_auto_waitlist_symptom_checker
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.auto_insert_waitlist_from_symptom_checker();