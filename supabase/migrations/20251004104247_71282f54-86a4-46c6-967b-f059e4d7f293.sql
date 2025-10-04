-- Enable RLS on specialist_search_cache (CRITICAL SECURITY FIX)
ALTER TABLE public.specialist_search_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to search cache (performance optimization)
CREATE POLICY "Anyone can view search cache"
ON public.specialist_search_cache
FOR SELECT
TO public
USING (expires_at > now());

-- Only system can insert/update cache entries
CREATE POLICY "System can manage search cache"
ON public.specialist_search_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);