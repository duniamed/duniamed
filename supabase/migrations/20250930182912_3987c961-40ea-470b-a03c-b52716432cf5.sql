-- Add missing fields to specialists table for complete profile management
ALTER TABLE public.specialists 
ADD COLUMN IF NOT EXISTS insurance_accepted text[],
ADD COLUMN IF NOT EXISTS board_certifications text[],
ADD COLUMN IF NOT EXISTS hospital_affiliations text[],
ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS publications text[],
ADD COLUMN IF NOT EXISTS awards text[],
ADD COLUMN IF NOT EXISTS professional_memberships text[],
ADD COLUMN IF NOT EXISTS telemedicine_platforms text[],
ADD COLUMN IF NOT EXISTS practice_hours jsonb,
ADD COLUMN IF NOT EXISTS emergency_availability boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS accepts_new_patients_date date,
ADD COLUMN IF NOT EXISTS virtual_clinic_id uuid REFERENCES public.clinics(id),
ADD COLUMN IF NOT EXISTS personal_statement text,
ADD COLUMN IF NOT EXISTS research_interests text[],
ADD COLUMN IF NOT EXISTS clinical_focus text[];

-- Add missing fields to clinics table
ALTER TABLE public.clinics
ADD COLUMN IF NOT EXISTS insurance_accepted text[],
ADD COLUMN IF NOT EXISTS certifications text[],
ADD COLUMN IF NOT EXISTS services_offered text[],
ADD COLUMN IF NOT EXISTS equipment_available text[],
ADD COLUMN IF NOT EXISTS parking_info text,
ADD COLUMN IF NOT EXISTS accessibility_features text[],
ADD COLUMN IF NOT EXISTS languages_supported text[],
ADD COLUMN IF NOT EXISTS booking_policies jsonb,
ADD COLUMN IF NOT EXISTS cancellation_policy text,
ADD COLUMN IF NOT EXISTS emergency_services boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS after_hours_available boolean DEFAULT false;

-- Add missing fields to profiles table for patients
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS insurance_provider text,
ADD COLUMN IF NOT EXISTS insurance_id text,
ADD COLUMN IF NOT EXISTS insurance_group text,
ADD COLUMN IF NOT EXISTS emergency_contact_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship text,
ADD COLUMN IF NOT EXISTS blood_type text,
ADD COLUMN IF NOT EXISTS allergies text[],
ADD COLUMN IF NOT EXISTS chronic_conditions text[],
ADD COLUMN IF NOT EXISTS current_medications text[],
ADD COLUMN IF NOT EXISTS preferred_pharmacy text,
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS communication_preferences jsonb DEFAULT '{}'::jsonb;

-- Create symptom_checker_sessions table for AI triage
CREATE TABLE IF NOT EXISTS public.symptom_checker_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  symptoms jsonb NOT NULL,
  ai_assessment jsonb,
  recommended_specialty text,
  urgency_level text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

ALTER TABLE public.symptom_checker_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own symptom checker sessions"
  ON public.symptom_checker_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own symptom checker sessions"
  ON public.symptom_checker_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create table for specialist-clinic relationships (virtual clinics)
CREATE TABLE IF NOT EXISTS public.specialist_clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid REFERENCES public.specialists(id) ON DELETE CASCADE NOT NULL,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  revenue_share_percentage numeric(5,2),
  permissions jsonb DEFAULT '{}'::jsonb,
  UNIQUE(specialist_id, clinic_id)
);

ALTER TABLE public.specialist_clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Specialists can view their clinic associations"
  ON public.specialist_clinics
  FOR SELECT
  TO authenticated
  USING (specialist_id IN (
    SELECT id FROM specialists WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clinic owners can manage specialist associations"
  ON public.specialist_clinics
  FOR ALL
  TO authenticated
  USING (clinic_id IN (
    SELECT id FROM clinics WHERE created_by = auth.uid()
  ));

-- Create AI personal assistant sessions table
CREATE TABLE IF NOT EXISTS public.ai_assistant_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  session_type text NOT NULL, -- 'triage', 'scheduling', 'documentation', 'financial_planning', etc.
  context jsonb,
  ai_interactions jsonb DEFAULT '[]'::jsonb,
  outcome jsonb,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

ALTER TABLE public.ai_assistant_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI sessions"
  ON public.ai_assistant_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Update specialists to auto-verify for testing (can be removed in production)
UPDATE public.specialists 
SET verification_status = 'verified' 
WHERE verification_status = 'pending' 
AND specialty IS NOT NULL 
AND array_length(specialty, 1) > 0;

-- Create index for faster search queries
CREATE INDEX IF NOT EXISTS idx_specialists_online_status ON public.specialists(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_specialists_accepting_patients ON public.specialists(is_accepting_patients) WHERE is_accepting_patients = true;
CREATE INDEX IF NOT EXISTS idx_specialists_verification ON public.specialists(verification_status) WHERE verification_status = 'verified';
CREATE INDEX IF NOT EXISTS idx_specialists_specialty ON public.specialists USING GIN(specialty);
CREATE INDEX IF NOT EXISTS idx_specialists_languages ON public.specialists USING GIN(languages);

-- Ensure updated_at triggers exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_specialists_updated_at ON public.specialists;
CREATE TRIGGER update_specialists_updated_at
  BEFORE UPDATE ON public.specialists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clinics_updated_at ON public.clinics;
CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();