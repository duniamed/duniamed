-- Enhanced review moderation system
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'published' CHECK (moderation_status IN ('published', 'pending', 'flagged', 'under_review', 'appealed'));
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderated_by UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS appeal_status TEXT CHECK (appeal_status IN ('none', 'pending', 'approved', 'rejected'));
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS clinical_feedback TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS administrative_feedback TEXT;

-- Complaint/dispute system
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_type TEXT NOT NULL CHECK (complaint_type IN ('service_quality', 'billing', 'medical_outcome', 'communication', 'availability', 'other')),
  filed_by UUID NOT NULL,
  filed_against UUID NOT NULL,
  against_type TEXT NOT NULL CHECK (against_type IN ('specialist', 'clinic')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'mediation', 'resolved', 'escalated', 'closed')),
  ticket_number TEXT UNIQUE NOT NULL DEFAULT 'CMPL-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
  evidence_urls JSONB DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  assigned_mediator UUID,
  escalated_to_board BOOLEAN DEFAULT false,
  board_case_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can file complaints"
ON public.complaints
FOR INSERT
WITH CHECK (filed_by = auth.uid());

CREATE POLICY "Users can view own complaints"
ON public.complaints
FOR SELECT
USING (filed_by = auth.uid() OR filed_against IN (
  SELECT id FROM public.specialists WHERE user_id = auth.uid()
));

CREATE POLICY "Specialists can view complaints against them"
ON public.complaints
FOR SELECT
USING (filed_against IN (
  SELECT id FROM public.specialists WHERE user_id = auth.uid()
));

-- Complaint messages/updates
CREATE TABLE IF NOT EXISTS public.complaint_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('patient', 'specialist', 'mediator', 'system')),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Complaint participants can view messages"
ON public.complaint_messages
FOR SELECT
USING (
  complaint_id IN (
    SELECT id FROM public.complaints 
    WHERE filed_by = auth.uid() 
    OR filed_against IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Complaint participants can send messages"
ON public.complaint_messages
FOR INSERT
WITH CHECK (sender_id = auth.uid());

-- Insurance verification tracking
CREATE TABLE IF NOT EXISTS public.insurance_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID REFERENCES public.specialists(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  insurance_network TEXT NOT NULL,
  insurance_provider TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'expired', 'invalid')),
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verification_source TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT check_entity CHECK (
    (specialist_id IS NOT NULL AND clinic_id IS NULL) OR
    (specialist_id IS NULL AND clinic_id IS NOT NULL)
  )
);

ALTER TABLE public.insurance_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified insurance"
ON public.insurance_verifications
FOR SELECT
USING (verification_status = 'verified');

CREATE POLICY "Specialists can manage own insurance"
ON public.insurance_verifications
FOR ALL
USING (specialist_id IN (
  SELECT id FROM public.specialists WHERE user_id = auth.uid()
));

CREATE POLICY "Clinics can manage own insurance"
ON public.insurance_verifications
FOR ALL
USING (clinic_id IN (
  SELECT id FROM public.clinics WHERE created_by = auth.uid()
));

-- Appointment confirmations
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_confirmed BOOLEAN DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS specialist_confirmed BOOLEAN DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS specialist_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS confirmation_required BOOLEAN DEFAULT true;

-- Profile verification
CREATE TABLE IF NOT EXISTS public.profile_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('license', 'education', 'certification', 'identity', 'insurance_panel')),
  document_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  rejection_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profile_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Specialists can view own verifications"
ON public.profile_verifications
FOR SELECT
USING (specialist_id IN (
  SELECT id FROM public.specialists WHERE user_id = auth.uid()
));

CREATE POLICY "Specialists can submit verifications"
ON public.profile_verifications
FOR INSERT
WITH CHECK (specialist_id IN (
  SELECT id FROM public.specialists WHERE user_id = auth.uid()
));

-- Analytics tracking
CREATE TABLE IF NOT EXISTS public.profile_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('specialist', 'clinic')),
  entity_id UUID NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('profile_view', 'booking_click', 'review_view', 'contact_click', 'share', 'favorite')),
  viewer_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profile_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can track analytics"
ON public.profile_analytics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Entity owners can view analytics"
ON public.profile_analytics
FOR SELECT
USING (
  (entity_type = 'specialist' AND entity_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())) OR
  (entity_type = 'clinic' AND entity_id IN (SELECT id FROM public.clinics WHERE created_by = auth.uid()))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaints_filed_by ON public.complaints(filed_by);
CREATE INDEX IF NOT EXISTS idx_complaints_filed_against ON public.complaints(filed_against);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaint_messages_complaint_id ON public.complaint_messages(complaint_id);
CREATE INDEX IF NOT EXISTS idx_insurance_verifications_specialist ON public.insurance_verifications(specialist_id);
CREATE INDEX IF NOT EXISTS idx_insurance_verifications_clinic ON public.insurance_verifications(clinic_id);
CREATE INDEX IF NOT EXISTS idx_profile_analytics_entity ON public.profile_analytics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON public.reviews(moderation_status);