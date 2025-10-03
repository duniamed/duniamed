-- C20 SUPPORT: Support tickets, agents, and escalations
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE DEFAULT ('TKT-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_agent_id UUID REFERENCES auth.users(id),
  language TEXT NOT NULL DEFAULT 'en',
  region TEXT,
  sla_due_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  csat_rating INTEGER,
  csat_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_type TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  escalated_by UUID NOT NULL REFERENCES auth.users(id),
  escalated_to UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C21 CONNECTORS: Integration management
CREATE TABLE IF NOT EXISTS public.connector_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_type TEXT NOT NULL,
  connector_name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  scopes TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.connector_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES public.connector_configurations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.connector_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES public.connector_configurations(id) ON DELETE CASCADE,
  data_types TEXT[] NOT NULL,
  purpose TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- C22 RBAC: Role-based access control
CREATE TYPE public.app_role AS ENUM ('patient', 'specialist', 'clinic_admin', 'clinic_staff', 'support_agent', 'admin', 'moderator');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, resource, action)
);

CREATE TABLE IF NOT EXISTS public.sensitive_access_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_by UUID NOT NULL REFERENCES auth.users(id),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  access_type TEXT NOT NULL,
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C23 ENGAGEMENT: Patient engagement and campaigns
CREATE TABLE IF NOT EXISTS public.engagement_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  target_audience JSONB NOT NULL DEFAULT '{}',
  message_template TEXT NOT NULL,
  channels TEXT[] NOT NULL DEFAULT '{}',
  schedule JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  analytics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.engagement_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.engagement_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.engagement_campaigns(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C24 PAYMENTS: Payment processing and invoicing
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  specialist_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  payment_method TEXT,
  captured_at TIMESTAMP WITH TIME ZONE,
  refund_eligibility TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE DEFAULT ('INV-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  specialist_id UUID NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id),
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC NOT NULL,
  tax NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft',
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id UUID NOT NULL REFERENCES public.payment_intents(id) ON DELETE CASCADE,
  refund_amount NUMERIC NOT NULL,
  refund_reason TEXT NOT NULL,
  refund_policy_applied TEXT,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_refund_id TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payout_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_earnings NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  net_payout NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  payout_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (expires_at IS NULL OR expires_at > NOW())
  )
$$;

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensitive_access_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'support_agent') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Support agents can update tickets" ON public.support_tickets FOR UPDATE USING (has_role(auth.uid(), 'support_agent') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own interactions" ON public.support_interactions FOR SELECT USING (ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'support_agent'));
CREATE POLICY "Users create interactions" ON public.support_interactions FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users manage own connectors" ON public.connector_configurations FOR ALL USING (user_id = auth.uid() OR clinic_id IN (SELECT clinic_id FROM public.clinic_staff WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own connector consents" ON public.connector_consents FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own alerts" ON public.sensitive_access_alerts FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Clinics manage campaigns" ON public.engagement_campaigns FOR ALL USING (created_by = auth.uid() OR clinic_id IN (SELECT clinic_id FROM public.clinic_staff WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own tasks" ON public.engagement_tasks FOR ALL USING (patient_id = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Users view own payments" ON public.payment_intents FOR SELECT USING (patient_id = auth.uid() OR specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));
CREATE POLICY "System creates payments" ON public.payment_intents FOR INSERT WITH CHECK (true);

CREATE POLICY "Users view own invoices" ON public.invoices FOR SELECT USING (patient_id = auth.uid() OR specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));

CREATE POLICY "Users request refunds" ON public.refunds FOR INSERT WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Users view own refunds" ON public.refunds FOR SELECT USING (payment_intent_id IN (SELECT id FROM public.payment_intents WHERE patient_id = auth.uid()));

CREATE POLICY "Specialists view own payouts" ON public.payout_schedules FOR SELECT USING (specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_connector_configurations_updated_at BEFORE UPDATE ON public.connector_configurations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_engagement_campaigns_updated_at BEFORE UPDATE ON public.engagement_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON public.payment_intents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();