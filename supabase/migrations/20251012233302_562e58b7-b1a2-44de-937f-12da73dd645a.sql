-- Phase 2: Voice AI & SOAP Automation - Additional Schema

-- Voice transcription logs
CREATE TABLE IF NOT EXISTS public.voice_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  specialist_id UUID REFERENCES public.specialists(id) ON DELETE CASCADE,
  audio_duration_seconds INTEGER,
  transcription_text TEXT,
  soap_note_id UUID REFERENCES public.soap_notes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_transcriptions_appointment ON public.voice_transcriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_voice_transcriptions_specialist ON public.voice_transcriptions(specialist_id);

ALTER TABLE public.voice_transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Specialists view own transcriptions"
  ON public.voice_transcriptions
  FOR SELECT
  USING (specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));

CREATE POLICY "System creates transcriptions"
  ON public.voice_transcriptions
  FOR INSERT
  WITH CHECK (true);

-- SOAP note templates
CREATE TABLE IF NOT EXISTS public.soap_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty TEXT NOT NULL,
  condition TEXT NOT NULL,
  template_content JSONB NOT NULL,
  icd10_codes TEXT[],
  common_prescriptions JSONB,
  created_by UUID REFERENCES public.profiles(id),
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soap_templates_specialty ON public.soap_templates(specialty);

ALTER TABLE public.soap_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view public templates"
  ON public.soap_templates
  FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users create own templates"
  ON public.soap_templates
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users update own templates"
  ON public.soap_templates
  FOR UPDATE
  USING (created_by = auth.uid());