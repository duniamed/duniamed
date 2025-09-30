-- Recreate the view as SECURITY INVOKER (default) instead of SECURITY DEFINER
-- This ensures the view uses the querying user's permissions, not the creator's
DROP VIEW IF EXISTS public.clinics_public;

CREATE VIEW public.clinics_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  description,
  city,
  state,
  country,
  specialties,
  clinic_type,
  is_active,
  operating_hours,
  website,
  logo_url,
  created_at
FROM public.clinics
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public.clinics_public TO anon;
GRANT SELECT ON public.clinics_public TO authenticated;