-- Create prescription renewals table
CREATE TABLE IF NOT EXISTS public.prescription_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES auth.users(id),
  pharmacy_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'completed')),
  notes text,
  denial_reason text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create procedure orders table
CREATE TABLE IF NOT EXISTS public.procedure_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id),
  specialist_id uuid NOT NULL REFERENCES public.specialists(id),
  procedure_name text NOT NULL,
  procedure_type text,
  description text,
  scheduled_date date,
  scheduled_time time,
  location text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'prep', 'in_progress', 'recovery', 'completed', 'cancelled')),
  pre_procedure_instructions text,
  post_procedure_notes text,
  estimated_duration_minutes integer DEFAULT 60,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create procedure checklist items
CREATE TABLE IF NOT EXISTS public.procedure_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL REFERENCES public.procedure_orders(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  task_type text DEFAULT 'required',
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  due_date date,
  instructions text,
  sequence_order integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prescription_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prescription renewals
CREATE POLICY "Patients view own renewals" ON public.prescription_renewals
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Patients create renewals" ON public.prescription_renewals
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Specialists view renewals for their prescriptions" ON public.prescription_renewals
  FOR SELECT USING (
    prescription_id IN (
      SELECT id FROM public.prescriptions 
      WHERE specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Specialists update renewals" ON public.prescription_renewals
  FOR UPDATE USING (
    prescription_id IN (
      SELECT id FROM public.prescriptions 
      WHERE specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
    )
  );

-- RLS Policies for procedure orders
CREATE POLICY "Patients view own procedures" ON public.procedure_orders
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Specialists view their procedures" ON public.procedure_orders
  FOR SELECT USING (
    specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
  );

CREATE POLICY "Specialists manage procedures" ON public.procedure_orders
  FOR ALL USING (
    specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
  );

-- RLS Policies for checklist items
CREATE POLICY "Patients view own checklist" ON public.procedure_checklist_items
  FOR SELECT USING (
    procedure_id IN (SELECT id FROM public.procedure_orders WHERE patient_id = auth.uid())
  );

CREATE POLICY "Specialists manage checklist" ON public.procedure_checklist_items
  FOR ALL USING (
    procedure_id IN (
      SELECT id FROM public.procedure_orders 
      WHERE specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
    )
  );

-- Create indexes
CREATE INDEX idx_prescription_renewals_patient ON public.prescription_renewals(patient_id);
CREATE INDEX idx_prescription_renewals_status ON public.prescription_renewals(status);
CREATE INDEX idx_procedure_orders_patient ON public.procedure_orders(patient_id);
CREATE INDEX idx_procedure_orders_specialist ON public.procedure_orders(specialist_id);
CREATE INDEX idx_procedure_orders_date ON public.procedure_orders(scheduled_date);
CREATE INDEX idx_procedure_checklist_procedure ON public.procedure_checklist_items(procedure_id);

-- Add triggers
CREATE TRIGGER update_prescription_renewals_updated_at BEFORE UPDATE ON public.prescription_renewals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procedure_orders_updated_at BEFORE UPDATE ON public.procedure_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();