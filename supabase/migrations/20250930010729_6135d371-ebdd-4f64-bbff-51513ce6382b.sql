-- Enable required extensions (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums only if they don't exist
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('patient', 'specialist', 'clinic_admin', 'reviewer', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE prescription_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'dispensed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE consultation_type AS ENUM ('video', 'in_person', 'phone', 'chat');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE clinic_type AS ENUM ('virtual', 'physical', 'hybrid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'in_review', 'verified', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE urgency_level AS ENUM ('emergency', 'urgent', 'moderate', 'routine');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'patient',
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  avatar_url TEXT,
  language_preference TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  country TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specialists table
CREATE TABLE IF NOT EXISTS public.specialists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialty TEXT[] NOT NULL,
  sub_specialty TEXT[],
  license_number TEXT NOT NULL,
  license_country TEXT NOT NULL,
  license_state TEXT,
  license_expiry DATE,
  medical_school TEXT,
  graduation_year INTEGER,
  years_experience INTEGER,
  languages TEXT[] DEFAULT ARRAY['en'],
  bio TEXT,
  consultation_fee_min DECIMAL(10,2),
  consultation_fee_max DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  video_consultation_enabled BOOLEAN DEFAULT TRUE,
  in_person_enabled BOOLEAN DEFAULT FALSE,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_consultations INTEGER DEFAULT 0,
  verification_status verification_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  is_accepting_patients BOOLEAN DEFAULT TRUE,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinics table
CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  clinic_type clinic_type NOT NULL,
  description TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  license_number TEXT,
  tax_id TEXT,
  operating_hours JSONB,
  specialties TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  subscription_tier TEXT DEFAULT 'basic',
  subscription_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinic staff table
CREATE TABLE IF NOT EXISTS public.clinic_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, user_id)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id),
  consultation_type consultation_type NOT NULL,
  status appointment_status DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  chief_complaint TEXT,
  symptoms JSONB,
  urgency_level urgency_level DEFAULT 'routine',
  video_room_url TEXT,
  video_room_id TEXT,
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES public.profiles(id),
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  fee DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical records table
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialist_id UUID REFERENCES public.specialists(id),
  appointment_id UUID REFERENCES public.appointments(id),
  record_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  is_fhir_compliant BOOLEAN DEFAULT FALSE,
  fhir_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOAP notes table
CREATE TABLE IF NOT EXISTS public.soap_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.specialists(id),
  patient_id UUID NOT NULL REFERENCES public.profiles(id),
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  transcript_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_number TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.specialists(id),
  appointment_id UUID REFERENCES public.appointments(id),
  status prescription_status DEFAULT 'draft',
  medication_name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER,
  quantity INTEGER,
  refills_allowed INTEGER DEFAULT 0,
  refills_remaining INTEGER DEFAULT 0,
  instructions TEXT,
  warnings TEXT,
  requires_local_review BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  patient_country TEXT NOT NULL,
  specialist_country TEXT NOT NULL,
  pharmacy_id UUID,
  dispensed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  digital_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table (encrypted chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT TRUE,
  read_at TIMESTAMPTZ,
  attachment_url TEXT,
  attachment_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id),
  payer_id UUID NOT NULL REFERENCES public.profiles(id),
  payee_id UUID NOT NULL REFERENCES public.specialists(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  platform_fee DECIMAL(10,2) NOT NULL,
  specialist_payout DECIMAL(10,2) NOT NULL,
  status payment_status DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID UNIQUE NOT NULL REFERENCES public.appointments(id),
  patient_id UUID NOT NULL REFERENCES public.profiles(id),
  specialist_id UUID NOT NULL REFERENCES public.specialists(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT TRUE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  specialist_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, specialist_id)
);

-- Family members table
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT,
  has_proxy_access BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consent records table
CREATE TABLE IF NOT EXISTS public.consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  version TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table (for security tracking)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_name TEXT,
  device_type TEXT,
  ip_address TEXT,
  user_agent TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability schedules table
CREATE TABLE IF NOT EXISTS public.availability_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time off table
CREATE TABLE IF NOT EXISTS public.specialist_time_off (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soap_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialist_time_off ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view verified specialists" ON public.specialists;
DROP POLICY IF EXISTS "Specialists can update own profile" ON public.specialists;
DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Specialists can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can view own records" ON public.medical_records;
DROP POLICY IF EXISTS "Specialists can view patient records for their appointments" ON public.medical_records;
DROP POLICY IF EXISTS "Specialists can create records" ON public.medical_records;
DROP POLICY IF EXISTS "Patients can view own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Specialists can view their prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Specialists can create prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for specialists
CREATE POLICY "Anyone can view verified specialists" ON public.specialists FOR SELECT USING (verification_status = 'verified');
CREATE POLICY "Specialists can update own profile" ON public.specialists FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for appointments
CREATE POLICY "Patients can view own appointments" ON public.appointments FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Specialists can view their appointments" ON public.appointments FOR SELECT USING (specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));
CREATE POLICY "Patients can create appointments" ON public.appointments FOR INSERT WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (patient_id = auth.uid() OR specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));

-- RLS Policies for medical records
CREATE POLICY "Patients can view own records" ON public.medical_records FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Specialists can view patient records for their appointments" ON public.medical_records FOR SELECT USING (specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));
CREATE POLICY "Specialists can create records" ON public.medical_records FOR INSERT WITH CHECK (specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));

-- RLS Policies for prescriptions
CREATE POLICY "Patients can view own prescriptions" ON public.prescriptions FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Specialists can view their prescriptions" ON public.prescriptions FOR SELECT USING (specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));
CREATE POLICY "Specialists can create prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));

-- RLS Policies for messages
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_specialists_updated_at ON public.specialists;
DROP TRIGGER IF EXISTS update_clinics_updated_at ON public.clinics;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS update_medical_records_updated_at ON public.medical_records;
DROP TRIGGER IF EXISTS update_soap_notes_updated_at ON public.soap_notes;
DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON public.prescriptions;
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_specialists_updated_at BEFORE UPDATE ON public.specialists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_soap_notes_updated_at BEFORE UPDATE ON public.soap_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance (IF NOT EXISTS not supported, so we'll check manually)
DO $$ BEGIN
  CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_appointments_specialist_id ON public.appointments(specialist_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_appointments_scheduled_at ON public.appointments(scheduled_at);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_appointments_status ON public.appointments(status);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_specialists_user_id ON public.specialists(user_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_specialists_specialty ON public.specialists USING GIN(specialty);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_prescriptions_patient_id ON public.prescriptions(patient_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_prescriptions_specialist_id ON public.prescriptions(specialist_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_medical_records_patient_id ON public.medical_records(patient_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;