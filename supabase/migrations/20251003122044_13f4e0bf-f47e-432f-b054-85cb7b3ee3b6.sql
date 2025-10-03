-- Create calendar sync infrastructure
CREATE TABLE IF NOT EXISTS public.calendar_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'outlook', 'ical')),
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  calendar_id text,
  sync_enabled boolean DEFAULT true,
  last_sync_at timestamptz,
  sync_errors jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider, calendar_id)
);

-- Create care teams table
CREATE TABLE IF NOT EXISTS public.care_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  description text,
  team_type text DEFAULT 'multidisciplinary',
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create care team members
CREATE TABLE IF NOT EXISTS public.care_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  specialist_id uuid REFERENCES public.specialists(id) ON DELETE CASCADE,
  role text NOT NULL,
  permissions jsonb DEFAULT '{}'::jsonb,
  joined_at timestamptz DEFAULT now()
);

-- Create provider absences table
CREATE TABLE IF NOT EXISTS public.provider_absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  absence_type text NOT NULL,
  reason text,
  coverage_specialist_id uuid REFERENCES public.specialists(id),
  auto_redirect boolean DEFAULT true,
  notification_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (end_date > start_date)
);

-- Create review responses table
CREATE TABLE IF NOT EXISTS public.review_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL,
  responder_id uuid NOT NULL REFERENCES auth.users(id),
  response_text text NOT NULL,
  is_public boolean DEFAULT true,
  evidence_urls jsonb DEFAULT '[]'::jsonb,
  moderation_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create secure deliveries table
CREATE TABLE IF NOT EXISTS public.secure_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  recipient_id uuid NOT NULL REFERENCES auth.users(id),
  message_type text NOT NULL,
  encrypted_content text NOT NULL,
  delivery_method text DEFAULT 'in_app',
  delivered_at timestamptz,
  read_at timestamptz,
  expires_at timestamptz,
  download_count integer DEFAULT 0,
  max_downloads integer DEFAULT 1,
  delivery_confirmation boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create professional networking tables
CREATE TABLE IF NOT EXISTS public.professional_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  connection_type text DEFAULT 'colleague',
  status text DEFAULT 'pending',
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, recipient_id)
);

CREATE TABLE IF NOT EXISTS public.referral_networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_specialist_id uuid NOT NULL REFERENCES public.specialists(id),
  recipient_specialist_id uuid NOT NULL REFERENCES public.specialists(id),
  referral_count integer DEFAULT 0,
  active_referrals integer DEFAULT 0,
  trust_score numeric(3,2) DEFAULT 0.0,
  specialties_referred text[] DEFAULT '{}',
  last_referral_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create multi-practitioner scheduling slots
CREATE TABLE IF NOT EXISTS public.group_appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  required_specialists uuid[] NOT NULL,
  slot_datetime timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  slot_type text DEFAULT 'sequential',
  room_id uuid,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_appointment_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar providers
CREATE POLICY "Users manage own calendar providers" ON public.calendar_providers
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for care teams
CREATE POLICY "Clinic staff view care teams" ON public.care_teams
  FOR SELECT USING (
    clinic_id IN (SELECT clinic_id FROM public.clinic_staff WHERE user_id = auth.uid())
  );

CREATE POLICY "Clinic admins manage care teams" ON public.care_teams
  FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE created_by = auth.uid())
  );

-- RLS Policies for care team members
CREATE POLICY "Team members view their teams" ON public.care_team_members
  FOR SELECT USING (
    team_id IN (
      SELECT ct.id FROM public.care_teams ct
      JOIN public.clinic_staff cs ON cs.clinic_id = ct.clinic_id
      WHERE cs.user_id = auth.uid()
    )
  );

-- RLS Policies for provider absences
CREATE POLICY "Specialists manage own absences" ON public.provider_absences
  FOR ALL USING (
    specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
  );

CREATE POLICY "Clinic staff view absences" ON public.provider_absences
  FOR SELECT USING (
    specialist_id IN (
      SELECT s.id FROM public.specialists s
      JOIN public.clinic_staff cs ON cs.user_id = s.user_id
      WHERE cs.clinic_id IN (SELECT clinic_id FROM public.clinic_staff WHERE user_id = auth.uid())
    )
  );

-- RLS Policies for review responses
CREATE POLICY "Users view public responses" ON public.review_responses
  FOR SELECT USING (is_public = true OR responder_id = auth.uid());

CREATE POLICY "Users create responses" ON public.review_responses
  FOR INSERT WITH CHECK (responder_id = auth.uid());

-- RLS Policies for secure deliveries
CREATE POLICY "Users view own deliveries" ON public.secure_deliveries
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users send deliveries" ON public.secure_deliveries
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- RLS Policies for professional connections
CREATE POLICY "Users manage own connections" ON public.professional_connections
  FOR ALL USING (requester_id = auth.uid() OR recipient_id = auth.uid());

-- RLS Policies for referral networks
CREATE POLICY "Specialists view referral networks" ON public.referral_networks
  FOR SELECT USING (
    sender_specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()) OR
    recipient_specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
  );

-- RLS Policies for group appointment slots
CREATE POLICY "Public view available slots" ON public.group_appointment_slots
  FOR SELECT USING (is_available = true);

CREATE POLICY "Clinic staff manage slots" ON public.group_appointment_slots
  FOR ALL USING (
    clinic_id IN (SELECT clinic_id FROM public.clinic_staff WHERE user_id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX idx_calendar_providers_user ON public.calendar_providers(user_id);
CREATE INDEX idx_care_teams_clinic ON public.care_teams(clinic_id);
CREATE INDEX idx_provider_absences_dates ON public.provider_absences(specialist_id, start_date, end_date);
CREATE INDEX idx_group_slots_datetime ON public.group_appointment_slots(slot_datetime) WHERE is_available = true;
CREATE INDEX idx_professional_connections_status ON public.professional_connections(status);

-- Add update timestamp triggers
CREATE TRIGGER update_calendar_providers_updated_at BEFORE UPDATE ON public.calendar_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_care_teams_updated_at BEFORE UPDATE ON public.care_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_absences_updated_at BEFORE UPDATE ON public.provider_absences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();