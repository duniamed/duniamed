-- C11 FRESHNESS: Profile freshness tracking and crowd-flagging
CREATE TABLE IF NOT EXISTS public.profile_freshness_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID REFERENCES public.specialists(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  is_verification BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID REFERENCES public.specialists(id) ON DELETE CASCADE NOT NULL,
  flagged_by UUID REFERENCES auth.users(id) NOT NULL,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('outdated_info', 'incorrect_credential', 'wrong_specialty', 'other')),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.verification_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID REFERENCES public.specialists(id) ON DELETE CASCADE NOT NULL,
  verification_type TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  reminder_sent_at TIMESTAMPTZ,
  verification_document_url TEXT,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- C12 MEDIATION: Dispute and mediation system
CREATE TABLE IF NOT EXISTS public.review_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  filed_by UUID REFERENCES auth.users(id) NOT NULL,
  dispute_reason TEXT NOT NULL,
  evidence_urls JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'rejected')),
  assigned_mediator UUID REFERENCES auth.users(id),
  resolution TEXT,
  review_quarantined BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  case_number TEXT UNIQUE DEFAULT 'DSP-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')
);

CREATE TABLE IF NOT EXISTS public.mediation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES public.review_disputes(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('patient', 'specialist', 'mediator')),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- C13 CROSS-BORDER: Localization and geo-restrictions
CREATE TABLE IF NOT EXISTS public.user_locale_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  currency TEXT DEFAULT 'USD',
  geo_location TEXT,
  region_restrictions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- C14 DELIVERY: Message delivery tracking
CREATE TABLE IF NOT EXISTS public.message_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'whatsapp', 'in_app')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_delivery_id UUID REFERENCES public.message_deliveries(id) ON DELETE CASCADE NOT NULL,
  confirmation_type TEXT NOT NULL CHECK (confirmation_type IN ('not_received', 'received', 'acknowledged')),
  confirmed_by UUID REFERENCES auth.users(id) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add notification_channels table if not exists (C4)
CREATE TABLE IF NOT EXISTS public.notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'sms', 'push', 'whatsapp')),
  channel_value TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, channel_type, channel_value)
);

-- RLS Policies
ALTER TABLE public.profile_freshness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mediation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locale_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;

-- Profile freshness logs: Anyone can view, specialists can manage own
CREATE POLICY "Anyone view freshness logs" ON public.profile_freshness_logs FOR SELECT USING (true);
CREATE POLICY "Specialists manage own logs" ON public.profile_freshness_logs FOR ALL 
  USING (specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid()));

-- Profile flags: Users can flag, specialists can view flags on their profile
CREATE POLICY "Users can flag profiles" ON public.profile_flags FOR INSERT 
  WITH CHECK (flagged_by = auth.uid());
CREATE POLICY "Users view own flags" ON public.profile_flags FOR SELECT 
  USING (flagged_by = auth.uid() OR specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid()));

-- Verification cycles: Specialists manage own cycles
CREATE POLICY "Specialists manage own verification cycles" ON public.verification_cycles FOR ALL 
  USING (specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid()));

-- Review disputes: Filed users and specialists can view, mediators can view all
CREATE POLICY "Dispute participants can view" ON public.review_disputes FOR SELECT 
  USING (
    filed_by = auth.uid() OR 
    review_id IN (SELECT id FROM reviews WHERE specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid())) OR
    assigned_mediator = auth.uid()
  );
CREATE POLICY "Users can file disputes" ON public.review_disputes FOR INSERT 
  WITH CHECK (filed_by = auth.uid());

-- Mediation messages: Dispute participants can view and send
CREATE POLICY "Dispute participants can view messages" ON public.mediation_messages FOR SELECT 
  USING (
    sender_id = auth.uid() OR
    dispute_id IN (
      SELECT id FROM review_disputes 
      WHERE filed_by = auth.uid() OR assigned_mediator = auth.uid() OR
      review_id IN (SELECT id FROM reviews WHERE specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid()))
    )
  );
CREATE POLICY "Dispute participants can send messages" ON public.mediation_messages FOR INSERT 
  WITH CHECK (sender_id = auth.uid());

-- User locale preferences: Users manage own preferences
CREATE POLICY "Users manage own locale preferences" ON public.user_locale_preferences FOR ALL 
  USING (user_id = auth.uid());

-- Message deliveries: Recipients can view own deliveries
CREATE POLICY "Recipients view own deliveries" ON public.message_deliveries FOR SELECT 
  USING (recipient_id = auth.uid());
CREATE POLICY "System creates deliveries" ON public.message_deliveries FOR INSERT 
  WITH CHECK (true);

-- Delivery confirmations: Users can confirm own deliveries
CREATE POLICY "Users confirm own deliveries" ON public.delivery_confirmations FOR INSERT 
  WITH CHECK (confirmed_by = auth.uid());
CREATE POLICY "Users view own confirmations" ON public.delivery_confirmations FOR SELECT 
  USING (confirmed_by = auth.uid());

-- Notification channels: Users manage own channels
CREATE POLICY "Users manage own notification channels" ON public.notification_channels FOR ALL 
  USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_freshness_logs_specialist ON public.profile_freshness_logs(specialist_id);
CREATE INDEX IF NOT EXISTS idx_profile_flags_specialist ON public.profile_flags(specialist_id);
CREATE INDEX IF NOT EXISTS idx_profile_flags_status ON public.profile_flags(status);
CREATE INDEX IF NOT EXISTS idx_verification_cycles_specialist ON public.verification_cycles(specialist_id);
CREATE INDEX IF NOT EXISTS idx_verification_cycles_status ON public.verification_cycles(status);
CREATE INDEX IF NOT EXISTS idx_review_disputes_review ON public.review_disputes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_disputes_status ON public.review_disputes(status);
CREATE INDEX IF NOT EXISTS idx_mediation_messages_dispute ON public.mediation_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_message_deliveries_recipient ON public.message_deliveries(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_deliveries_status ON public.message_deliveries(status);