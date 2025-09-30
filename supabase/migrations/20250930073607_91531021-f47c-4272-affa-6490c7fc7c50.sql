-- Drop the overly permissive policy on clinics table
DROP POLICY IF EXISTS "Authenticated users can view public clinic info" ON public.clinics;

-- Create a more restrictive policy for clinics
-- Only clinic owners, staff, and users with appointments can see full clinic details
CREATE POLICY "Restricted clinic access"
ON public.clinics
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  public.is_clinic_staff(auth.uid(), id) OR
  id IN (
    SELECT clinic_id 
    FROM appointments 
    WHERE patient_id = auth.uid() OR specialist_id IN (
      SELECT id FROM specialists WHERE user_id = auth.uid()
    )
  )
);

-- Recreate clinics_public view with only safe, non-sensitive public information
-- This view excludes: email, phone, address details, license_number, tax_id, stripe_customer_id
DROP VIEW IF EXISTS public.clinics_public;

CREATE VIEW public.clinics_public AS
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

-- Grant public read access to the view (view inherits RLS from base table)
GRANT SELECT ON public.clinics_public TO anon;
GRANT SELECT ON public.clinics_public TO authenticated;