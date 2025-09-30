-- Fix the handle_clinic_creation function to use a valid default clinic_type
CREATE OR REPLACE FUNCTION public.handle_clinic_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
        'physical'::clinic_type
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
$function$;