-- Create function to handle specialist creation after profile insert
CREATE OR REPLACE FUNCTION public.handle_specialist_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create specialist record if role is specialist
  IF NEW.role = 'specialist' THEN
    INSERT INTO public.specialists (
      user_id,
      specialty,
      sub_specialty,
      license_number,
      license_country,
      license_state,
      bio,
      languages,
      is_accepting_patients,
      verification_status
    )
    VALUES (
      NEW.id,
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text((SELECT raw_user_meta_data->'specialties' FROM auth.users WHERE id = NEW.id))),
        ARRAY['General Practice']::text[]
      ),
      NULL,
      COALESCE((SELECT raw_user_meta_data->>'license_number' FROM auth.users WHERE id = NEW.id), ''),
      COALESCE((SELECT raw_user_meta_data->>'jurisdiction' FROM auth.users WHERE id = NEW.id), 'US'),
      COALESCE((SELECT raw_user_meta_data->>'license_state' FROM auth.users WHERE id = NEW.id), ''),
      '',
      ARRAY['en']::text[],
      true,
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create specialist records
DROP TRIGGER IF EXISTS on_specialist_profile_created ON public.profiles;
CREATE TRIGGER on_specialist_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_specialist_creation();

-- Create function to handle clinic creation after profile insert
CREATE OR REPLACE FUNCTION public.handle_clinic_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create clinic record if role is clinic_admin
  IF NEW.role = 'clinic_admin' THEN
    INSERT INTO public.clinics (
      created_by,
      name,
      clinic_type,
      email,
      phone,
      description,
      specialties,
      country,
      is_active
    )
    VALUES (
      NEW.id,
      COALESCE((SELECT raw_user_meta_data->>'clinic_name' FROM auth.users WHERE id = NEW.id), 'Clinic'),
      COALESCE(
        (SELECT raw_user_meta_data->>'clinic_type' FROM auth.users WHERE id = NEW.id)::clinic_type,
        'general_practice'::clinic_type
      ),
      NEW.email,
      NEW.phone,
      '',
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text((SELECT raw_user_meta_data->'clinic_specialties' FROM auth.users WHERE id = NEW.id))),
        ARRAY['General Practice']::text[]
      ),
      COALESCE((SELECT raw_user_meta_data->>'jurisdiction' FROM auth.users WHERE id = NEW.id), 'US'),
      true
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create clinic records
DROP TRIGGER IF EXISTS on_clinic_profile_created ON public.profiles;
CREATE TRIGGER on_clinic_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_clinic_creation();

-- Drop policy if exists and recreate
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Specialists can view own profile" ON public.specialists;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add RLS policy to allow specialists to view their own record
CREATE POLICY "Specialists can view own profile"
ON public.specialists
FOR SELECT
TO authenticated
USING (user_id = auth.uid());