-- Fix P0 Security Issue: Add missing RLS policies for Clinical Focus Mode and Evening Load Firewall

-- 1. evening_load_metrics - Missing policies
CREATE POLICY "Users can manage own evening metrics"
  ON evening_load_metrics FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Clinic admins can view staff metrics"
  ON evening_load_metrics FOR SELECT
  USING (clinic_id IN (
    SELECT id FROM clinics WHERE created_by = auth.uid()
  ));

-- 2. focus_sessions - Missing policies
CREATE POLICY "Users can manage own focus sessions"
  ON focus_sessions FOR ALL
  USING (user_id = auth.uid());

-- 3. response_macros - Missing policies  
CREATE POLICY "Clinic staff can view response macros"
  ON response_macros FOR SELECT
  USING (clinic_id IN (
    SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clinic admins can manage response macros"
  ON response_macros FOR ALL
  USING (clinic_id IN (
    SELECT id FROM clinics WHERE created_by = auth.uid()
  ));

-- Fix security definer functions with proper search_path
DROP FUNCTION IF EXISTS public.update_timestamp() CASCADE;
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.handle_specialist_creation() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_specialist_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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