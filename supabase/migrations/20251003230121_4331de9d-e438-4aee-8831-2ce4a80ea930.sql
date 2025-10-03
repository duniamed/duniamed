-- Create message_delivery_status table for WhatsApp delivery tracking
CREATE TABLE IF NOT EXISTS public.message_delivery_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  profile_name TEXT,
  wa_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_delivery_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view delivery status for their messages
CREATE POLICY "Users view own message delivery status"
ON public.message_delivery_status
FOR SELECT
USING (
  message_id IN (
    SELECT message_sid FROM whatsapp_messages WHERE user_id = auth.uid()
  )
);

-- Create group_booking_sessions table
CREATE TABLE IF NOT EXISTS public.group_booking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id),
  specialist_ids UUID[] NOT NULL,
  preferred_date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmed_slots JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_booking_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users manage own group booking sessions
CREATE POLICY "Users manage own group sessions"
ON public.group_booking_sessions
FOR ALL
USING (organizer_id = auth.uid());

-- Create cost_estimate_locks table
CREATE TABLE IF NOT EXISTS public.cost_estimate_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  locked_price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cost_estimate_locks ENABLE ROW LEVEL SECURITY;

-- Policy: Patients manage own locks
CREATE POLICY "Patients manage own locks"
ON public.cost_estimate_locks
FOR ALL
USING (patient_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_delivery_status_message_id ON public.message_delivery_status(message_id);
CREATE INDEX IF NOT EXISTS idx_group_booking_sessions_organizer ON public.group_booking_sessions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_cost_estimate_locks_patient ON public.cost_estimate_locks(patient_id);
CREATE INDEX IF NOT EXISTS idx_cost_estimate_locks_expires ON public.cost_estimate_locks(expires_at) WHERE is_active = true;