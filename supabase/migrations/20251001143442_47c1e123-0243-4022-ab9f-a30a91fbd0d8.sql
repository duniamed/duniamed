-- Add clinic integrations table
CREATE TABLE IF NOT EXISTS public.clinic_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('google_business', 'instagram', 'facebook', 'twitter')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  profile_id TEXT,
  profile_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(clinic_id, integration_type)
);

-- RLS for clinic integrations
ALTER TABLE public.clinic_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic owners can manage integrations"
ON public.clinic_integrations
FOR ALL
USING (
  clinic_id IN (
    SELECT id FROM public.clinics WHERE created_by = auth.uid()
  )
);

-- Add financial data table for AI analysis
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'payment', 'refund', 'payout')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  category TEXT,
  description TEXT,
  appointment_id UUID REFERENCES public.appointments(id),
  payment_id UUID REFERENCES public.payments(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financial transactions"
ON public.financial_transactions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create financial transactions"
ON public.financial_transactions
FOR INSERT
WITH CHECK (true);

-- Add EHDS compliance tables
CREATE TABLE IF NOT EXISTS public.ehds_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('data_portability', 'cross_border_access', 'research_use', 'secondary_use')),
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  ehds_compliant BOOLEAN DEFAULT true,
  jurisdiction TEXT NOT NULL,
  legal_basis TEXT,
  consent_document_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ehds_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own EHDS consents"
ON public.ehds_consents
FOR ALL
USING (user_id = auth.uid());

-- Add data portability requests table
CREATE TABLE IF NOT EXISTS public.data_portability_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'transfer', 'deletion')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  destination_system TEXT,
  data_format TEXT DEFAULT 'fhir_json',
  include_medical_records BOOLEAN DEFAULT true,
  include_appointments BOOLEAN DEFAULT true,
  include_prescriptions BOOLEAN DEFAULT true,
  export_url TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.data_portability_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own data portability requests"
ON public.data_portability_requests
FOR ALL
USING (user_id = auth.uid());

-- Update clinics_public view to include more SEO data
DROP VIEW IF EXISTS public.clinics_public;

CREATE OR REPLACE VIEW public.clinics_public AS
SELECT 
  c.id,
  c.name,
  c.description,
  c.clinic_type,
  c.logo_url,
  c.cover_image_url,
  c.tagline,
  c.mission_statement,
  c.website,
  c.phone,
  c.email,
  c.address_line1,
  c.city,
  c.state,
  c.country,
  c.postal_code,
  c.specialties,
  c.languages_supported,
  c.operating_hours,
  c.is_active,
  c.created_at,
  LOWER(REGEXP_REPLACE(c.name, '[^a-zA-Z0-9]+', '-', 'g')) as slug,
  (SELECT COUNT(*) FROM public.clinic_staff WHERE clinic_id = c.id AND is_active = true) as staff_count,
  (SELECT AVG(r.rating) FROM public.reviews r 
   JOIN public.specialists s ON r.specialist_id = s.id 
   JOIN public.specialist_clinics sc ON s.id = sc.specialist_id 
   WHERE sc.clinic_id = c.id) as average_rating
FROM public.clinics c
WHERE c.is_active = true;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_clinic_integrations_clinic_id ON public.clinic_integrations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ehds_consents_user_id ON public.ehds_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_data_portability_requests_user_id ON public.data_portability_requests(user_id);