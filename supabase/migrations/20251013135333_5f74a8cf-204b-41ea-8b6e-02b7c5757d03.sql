-- Create WhatsApp conversation sessions table (separate from existing messages table)
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  state TEXT NOT NULL DEFAULT 'greeting',
  context JSONB DEFAULT '{}',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone ON public.whatsapp_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_user ON public.whatsapp_sessions(user_id);

-- Create AI clinical suggestions table
CREATE TABLE IF NOT EXISTS public.ai_clinical_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID,
  specialist_id UUID,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('icd10', 'medication', 'protocol', 'drug_interaction')),
  suggestion_data JSONB NOT NULL,
  confidence_score NUMERIC(3,2),
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_appointment FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_appointment ON public.ai_clinical_suggestions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_specialist ON public.ai_clinical_suggestions(specialist_id);

-- Enable RLS
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_clinical_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users view own WhatsApp sessions" ON public.whatsapp_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System manages WhatsApp sessions" ON public.whatsapp_sessions FOR ALL USING (true);
CREATE POLICY "Specialists view own suggestions" ON public.ai_clinical_suggestions FOR SELECT USING (specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));
CREATE POLICY "Specialists manage own suggestions" ON public.ai_clinical_suggestions FOR ALL USING (specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));

-- Trigger
CREATE TRIGGER update_whatsapp_sessions_updated_at BEFORE UPDATE ON public.whatsapp_sessions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();