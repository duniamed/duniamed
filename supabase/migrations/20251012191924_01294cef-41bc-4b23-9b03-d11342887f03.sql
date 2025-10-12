-- Create tables for admin audit logging, alternative slots cache, and import comparison

-- Admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alternative slot cache table
CREATE TABLE IF NOT EXISTS public.alternative_slot_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL,
  original_slot TIMESTAMP WITH TIME ZONE NOT NULL,
  alternative_slots JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Import comparison table
CREATE TABLE IF NOT EXISTS public.import_comparison (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  source TEXT NOT NULL,
  imported_data JSONB NOT NULL,
  current_data JSONB NOT NULL,
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP WITH TIME ZONE,
  applied_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternative_slot_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_comparison ENABLE ROW LEVEL SECURITY;

-- Admin audit log policies
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
  ON public.admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Alternative slot cache policies
CREATE POLICY "Anyone can view alternative slots"
  ON public.alternative_slot_cache FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "System can manage alternative slots"
  ON public.alternative_slot_cache FOR ALL
  TO authenticated
  USING (TRUE);

-- Import comparison policies
CREATE POLICY "Clinic owners view import comparisons"
  ON public.import_comparison FOR SELECT
  TO authenticated
  USING (clinic_id IN (
    SELECT id FROM clinics WHERE created_by = auth.uid()
  ));

CREATE POLICY "Clinic owners manage import comparisons"
  ON public.import_comparison FOR ALL
  TO authenticated
  USING (clinic_id IN (
    SELECT id FROM clinics WHERE created_by = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_alternative_slot_cache_specialist_id ON public.alternative_slot_cache(specialist_id);
CREATE INDEX idx_alternative_slot_cache_expires_at ON public.alternative_slot_cache(expires_at);
CREATE INDEX idx_import_comparison_clinic_id ON public.import_comparison(clinic_id);
CREATE INDEX idx_import_comparison_created_at ON public.import_comparison(created_at DESC);