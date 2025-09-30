-- Create waitlist table for appointments
CREATE TABLE IF NOT EXISTS public.appointment_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES auth.users(id) NOT NULL,
  specialist_id uuid REFERENCES public.specialists(id) NOT NULL,
  preferred_date date,
  preferred_time_slot text,
  notes text,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'scheduled', 'cancelled')),
  notified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.appointment_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can manage own waitlist entries"
  ON public.appointment_waitlist
  FOR ALL
  TO authenticated
  USING (patient_id = auth.uid());

CREATE POLICY "Specialists can view their waitlist"
  ON public.appointment_waitlist
  FOR SELECT
  TO authenticated
  USING (specialist_id IN (
    SELECT id FROM specialists WHERE user_id = auth.uid()
  ));

-- Add reminder preferences to appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp with time zone;

-- Create reminder preferences in profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS reminder_preferences jsonb DEFAULT '{"email": true, "sms": false, "hours_before": 24}'::jsonb;

-- Create revenue splits table for virtual clinics
CREATE TABLE IF NOT EXISTS public.virtual_clinic_revenue_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  specialist_id uuid REFERENCES public.specialists(id) ON DELETE CASCADE NOT NULL,
  split_percentage numeric(5,2) NOT NULL CHECK (split_percentage >= 0 AND split_percentage <= 100),
  platform_fee_percentage numeric(5,2) DEFAULT 10.00 CHECK (platform_fee_percentage >= 0 AND platform_fee_percentage <= 100),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(clinic_id, specialist_id)
);

ALTER TABLE public.virtual_clinic_revenue_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic owners can manage revenue splits"
  ON public.virtual_clinic_revenue_splits
  FOR ALL
  TO authenticated
  USING (clinic_id IN (
    SELECT id FROM clinics WHERE created_by = auth.uid()
  ));

CREATE POLICY "Specialists can view their revenue splits"
  ON public.virtual_clinic_revenue_splits
  FOR SELECT
  TO authenticated
  USING (specialist_id IN (
    SELECT id FROM specialists WHERE user_id = auth.uid()
  ));

-- Create shared patient queue for virtual clinics
CREATE TABLE IF NOT EXISTS public.virtual_clinic_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES auth.users(id) NOT NULL,
  symptoms jsonb,
  urgency_level text DEFAULT 'routine' CHECK (urgency_level IN ('emergency', 'urgent', 'routine')),
  assigned_specialist_id uuid REFERENCES public.specialists(id),
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'assigned', 'in_consultation', 'completed', 'cancelled')),
  queue_position integer,
  joined_at timestamp with time zone DEFAULT now(),
  assigned_at timestamp with time zone,
  completed_at timestamp with time zone,
  estimated_wait_minutes integer
);

ALTER TABLE public.virtual_clinic_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own queue entries"
  ON public.virtual_clinic_queue
  FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can add to queue"
  ON public.virtual_clinic_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Clinic staff can manage queue"
  ON public.virtual_clinic_queue
  FOR ALL
  TO authenticated
  USING (
    clinic_id IN (
      SELECT id FROM clinics WHERE created_by = auth.uid()
    ) OR 
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid() AND is_active = true
    ) OR
    assigned_specialist_id IN (
      SELECT id FROM specialists WHERE user_id = auth.uid()
    )
  );

-- Create clinic invitations table
CREATE TABLE IF NOT EXISTS public.clinic_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'specialist',
  invited_by uuid REFERENCES auth.users(id) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.clinic_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic owners can manage invitations"
  ON public.clinic_invitations
  FOR ALL
  TO authenticated
  USING (clinic_id IN (
    SELECT id FROM clinics WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can view invitations sent to their email"
  ON public.clinic_invitations
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Add branding fields to clinics
ALTER TABLE public.clinics
ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS brand_secondary_color text DEFAULT '#8b5cf6',
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS tagline text,
ADD COLUMN IF NOT EXISTS mission_statement text,
ADD COLUMN IF NOT EXISTS video_url text;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_specialist ON appointment_waitlist(specialist_id) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_waitlist_patient ON appointment_waitlist(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_clinic ON virtual_clinic_queue(clinic_id) WHERE status IN ('waiting', 'assigned');
CREATE INDEX IF NOT EXISTS idx_queue_specialist ON virtual_clinic_queue(assigned_specialist_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON clinic_invitations(email) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_invitations_token ON clinic_invitations(token) WHERE status = 'pending';