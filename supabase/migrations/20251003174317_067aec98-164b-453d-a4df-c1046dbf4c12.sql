-- Create moderation_logs table
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  original_content TEXT NOT NULL,
  redacted_content TEXT,
  phi_detected JSONB DEFAULT '[]'::jsonb,
  toxicity_score NUMERIC DEFAULT 0,
  moderation_action TEXT NOT NULL CHECK (moderation_action IN ('allow', 'redact', 'block')),
  moderated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create document_signatures table
CREATE TABLE IF NOT EXISTS public.document_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,
  document_id UUID NOT NULL,
  signer_id UUID NOT NULL REFERENCES auth.users(id),
  docusign_envelope_id TEXT UNIQUE,
  signing_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'signed', 'declined', 'voided')),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create medical_codes table
CREATE TABLE IF NOT EXISTS public.medical_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_system TEXT NOT NULL,
  code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(code_system, code)
);

-- Create legal_archives table
CREATE TABLE IF NOT EXISTS public.legal_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES public.complaints(id),
  archive_type TEXT NOT NULL,
  legal_hold BOOLEAN DEFAULT false,
  case_number TEXT,
  archived_data JSONB NOT NULL,
  archived_by UUID REFERENCES auth.users(id),
  archive_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create monitoring_events table
CREATE TABLE IF NOT EXISTS public.monitoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create voice_sessions table
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_type TEXT NOT NULL,
  conversation_id TEXT,
  transcript TEXT,
  duration_seconds INTEGER,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create chatbot_sessions table
CREATE TABLE IF NOT EXISTS public.chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_type TEXT DEFAULT 'support',
  messages JSONB DEFAULT '[]'::jsonb,
  escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  phone_number TEXT NOT NULL,
  message_sid TEXT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'queued',
  message_body TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  webhook_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moderation_logs
CREATE POLICY "Admins view moderation logs" ON public.moderation_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for document_signatures
CREATE POLICY "Users view own signatures" ON public.document_signatures
  FOR SELECT USING (signer_id = auth.uid());

CREATE POLICY "Users create signatures" ON public.document_signatures
  FOR INSERT WITH CHECK (signer_id = auth.uid());

-- RLS Policies for medical_codes
CREATE POLICY "Anyone view medical codes" ON public.medical_codes
  FOR SELECT USING (true);

-- RLS Policies for legal_archives
CREATE POLICY "Admins view legal archives" ON public.legal_archives
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for monitoring_events
CREATE POLICY "Admins view monitoring events" ON public.monitoring_events
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System create monitoring events" ON public.monitoring_events
  FOR INSERT WITH CHECK (true);

-- RLS Policies for voice_sessions
CREATE POLICY "Users manage own voice sessions" ON public.voice_sessions
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for chatbot_sessions
CREATE POLICY "Users manage own chatbot sessions" ON public.chatbot_sessions
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for whatsapp_messages
CREATE POLICY "Users view own whatsapp messages" ON public.whatsapp_messages
  FOR SELECT USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_moderation_logs_content ON public.moderation_logs(content_type, content_id);
CREATE INDEX idx_document_signatures_signer ON public.document_signatures(signer_id);
CREATE INDEX idx_medical_codes_code ON public.medical_codes(code_system, code);
CREATE INDEX idx_legal_archives_complaint ON public.legal_archives(complaint_id);
CREATE INDEX idx_monitoring_events_severity ON public.monitoring_events(severity, created_at);
CREATE INDEX idx_voice_sessions_user ON public.voice_sessions(user_id, created_at);
CREATE INDEX idx_chatbot_sessions_user ON public.chatbot_sessions(user_id, created_at);
CREATE INDEX idx_whatsapp_messages_user ON public.whatsapp_messages(user_id, phone_number);