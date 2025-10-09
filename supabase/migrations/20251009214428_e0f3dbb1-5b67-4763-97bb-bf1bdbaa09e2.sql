-- Fix SECURITY DEFINER function missing search_path protection
-- This prevents privilege escalation attacks via malicious schema creation

ALTER FUNCTION public.log_ai_config_change() SET search_path = public;