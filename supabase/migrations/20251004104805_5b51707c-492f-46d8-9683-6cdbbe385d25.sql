-- Fix search_path on update_updated_at_column function (CRITICAL SECURITY FIX)
-- Using CREATE OR REPLACE to avoid dropping triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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