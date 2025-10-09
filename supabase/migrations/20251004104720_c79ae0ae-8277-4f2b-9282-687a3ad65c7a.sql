-- Enable RLS on specialist_availability_cache (CRITICAL FIX)
ALTER TABLE public.specialist_availability_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to availability cache
CREATE POLICY "Anyone can view availability cache"
ON public.specialist_availability_cache
FOR SELECT
TO public
USING (expires_at > now());

-- Only system can manage availability cache
CREATE POLICY "System manages availability cache"
ON public.specialist_availability_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);