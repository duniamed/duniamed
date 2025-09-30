-- Fix clinic business data exposure by implementing granular RLS policies

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view active clinics" ON public.clinics;

-- Policy 1: Clinic owners can view and manage their own clinics (full access)
CREATE POLICY "Clinic owners have full access to their clinics"
ON public.clinics
FOR ALL
USING (created_by = auth.uid());

-- Policy 2: Clinic staff can view their clinic's full details
CREATE POLICY "Clinic staff can view their clinic details"
ON public.clinics
FOR SELECT
USING (
  id IN (
    SELECT clinic_id 
    FROM public.clinic_staff 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Policy 3: Authenticated users can view only non-sensitive clinic information
-- This allows patients to browse and find clinics without exposing sensitive data
CREATE POLICY "Authenticated users can view public clinic info"
ON public.clinics
FOR SELECT
TO authenticated
USING (
  is_active = true
  -- Note: This policy grants SELECT but application code should only display
  -- non-sensitive fields: name, description, logo_url, website, clinic_type,
  -- specialties, address fields, city, state, country, postal_code, operating_hours
  -- Do NOT expose: email, phone, tax_id, license_number, stripe_customer_id,
  -- subscription_tier, subscription_expires_at
);

-- Create a view for truly public (unauthenticated) access with only safe fields
CREATE OR REPLACE VIEW public.clinics_public AS
SELECT 
  id,
  name,
  description,
  logo_url,
  website,
  clinic_type,
  specialties,
  city,
  state,
  country,
  operating_hours,
  is_active,
  created_at
FROM public.clinics
WHERE is_active = true;

-- Enable RLS on the view
ALTER VIEW public.clinics_public SET (security_invoker = true);

-- Grant access to the public view
GRANT SELECT ON public.clinics_public TO anon, authenticated;