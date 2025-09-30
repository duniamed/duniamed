-- Drop existing problematic policies
DROP POLICY IF EXISTS "Clinic staff can view their clinic details" ON public.clinics;
DROP POLICY IF EXISTS "Clinic owners can manage staff" ON public.clinic_staff;
DROP POLICY IF EXISTS "Clinic staff can view own clinic staff" ON public.clinic_staff;

-- Create security definer functions to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.is_clinic_owner(_user_id uuid, _clinic_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clinics
    WHERE id = _clinic_id
      AND created_by = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_clinic_staff(_user_id uuid, _clinic_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clinic_staff
    WHERE clinic_id = _clinic_id
      AND user_id = _user_id
      AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_clinic_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id
  FROM public.clinic_staff
  WHERE user_id = _user_id
    AND is_active = true
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Clinic staff can view their clinic details"
ON public.clinics
FOR SELECT
TO authenticated
USING (
  public.is_clinic_staff(auth.uid(), id) OR
  created_by = auth.uid()
);

CREATE POLICY "Clinic owners can manage staff"
ON public.clinic_staff
FOR ALL
TO authenticated
USING (
  public.is_clinic_owner(auth.uid(), clinic_id)
);

CREATE POLICY "Clinic staff can view own clinic staff"
ON public.clinic_staff
FOR SELECT
TO authenticated
USING (
  public.is_clinic_owner(auth.uid(), clinic_id) OR
  user_id = auth.uid()
);