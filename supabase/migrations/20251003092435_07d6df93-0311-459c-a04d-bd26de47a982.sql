-- C4 RESILIENCE: Session management for rollbacks and biometric auth
CREATE TABLE IF NOT EXISTS public.session_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_data JSONB NOT NULL,
  device_info JSONB,
  biometric_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.session_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own session snapshots"
  ON public.session_snapshots
  FOR ALL
  USING (user_id = auth.uid());

-- C4: Notification delivery tracking
CREATE TABLE IF NOT EXISTS public.notification_delivery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL, -- email, sms, whatsapp, push
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, failed
  attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  message_content JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notification delivery"
  ON public.notification_delivery
  FOR SELECT
  USING (user_id = auth.uid());

-- C7 SUPPORT: Multilingual translation cache
CREATE TABLE IF NOT EXISTS public.translation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_text, source_language, target_language)
);

ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read translations"
  ON public.translation_cache
  FOR SELECT
  USING (true);

-- C9 VISIBILITY: Review keyword search optimization
CREATE INDEX IF NOT EXISTS idx_reviews_comment_search ON public.reviews USING gin(to_tsvector('english', comment));

-- C10 PROCEDURES: Match notifications for patients
CREATE TABLE IF NOT EXISTS public.procedure_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  procedure_id UUID NOT NULL REFERENCES public.procedure_catalog(id),
  specialist_id UUID NOT NULL REFERENCES public.specialists(id),
  match_score DECIMAL(3,2), -- 0.00 to 1.00
  match_reason JSONB,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  patient_viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.procedure_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view own matches"
  ON public.procedure_matches
  FOR SELECT
  USING (patient_id = auth.uid());

-- C10: Specialist verification reminders
CREATE TABLE IF NOT EXISTS public.verification_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES public.specialists(id),
  verification_type TEXT NOT NULL, -- credentials, procedures, certifications
  due_date DATE NOT NULL,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.verification_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Specialists view own reminders"
  ON public.verification_reminders
  FOR SELECT
  USING (specialist_id IN (
    SELECT id FROM public.specialists WHERE user_id = auth.uid()
  ));

-- Triggers for updated_at
CREATE TRIGGER update_session_snapshots_updated_at
  BEFORE UPDATE ON public.session_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_delivery_updated_at
  BEFORE UPDATE ON public.notification_delivery
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();