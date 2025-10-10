-- Create missing specialist record for existing specialist user
-- This handles cases where the trigger didn't fire during signup

INSERT INTO public.specialists (
  user_id,
  specialty,
  license_number,
  license_country,
  specialty_licenses,
  languages,
  is_accepting_patients,
  verification_status,
  consultation_fee_min,
  consultation_fee_max,
  currency
)
SELECT 
  p.id,
  COALESCE(
    ARRAY(SELECT jsonb_array_elements_text((SELECT raw_user_meta_data->'specialties' FROM auth.users WHERE id = p.id))),
    ARRAY['General Practice / Family Medicine']::text[]
  ),
  COALESCE((SELECT raw_user_meta_data->>'license_number' FROM auth.users WHERE id = p.id), ''),
  COALESCE((SELECT raw_user_meta_data->>'jurisdiction' FROM auth.users WHERE id = p.id), 'US'),
  COALESCE((SELECT raw_user_meta_data->'specialty_licenses' FROM auth.users WHERE id = p.id), '{}'::jsonb),
  ARRAY['en']::text[],
  true,
  'pending',
  100,
  200,
  'USD'
FROM public.profiles p
WHERE p.role = 'specialist'
  AND p.id NOT IN (SELECT user_id FROM public.specialists)
ON CONFLICT (user_id) DO NOTHING;