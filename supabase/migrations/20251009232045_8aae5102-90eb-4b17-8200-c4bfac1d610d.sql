-- Add specialty_licenses field to specialists table to store license numbers per specialty
ALTER TABLE public.specialists 
ADD COLUMN IF NOT EXISTS specialty_licenses JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.specialists.specialty_licenses IS 'Maps each specialty to its license number: {"Cardiology": "12345", "Internal Medicine": "67890"}';

-- Update the handle_specialist_creation function to include specialty_licenses
CREATE OR REPLACE FUNCTION public.handle_specialist_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role = 'specialist' THEN
    INSERT INTO public.specialists (
      user_id,
      specialty,
      sub_specialty,
      license_number,
      license_country,
      license_state,
      specialty_licenses,
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
      COALESCE((SELECT raw_user_meta_data->'specialty_licenses' FROM auth.users WHERE id = NEW.id), '{}'::jsonb),
      '',
      ARRAY['en']::text[],
      true,
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$function$;