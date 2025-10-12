-- Phase 2 & 4: Resource Management, Inventory, and Auto-Sync Triggers

-- Clinic resources table
CREATE TABLE IF NOT EXISTS public.clinic_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('room', 'equipment', 'staff')),
  resource_name TEXT NOT NULL,
  capacity INTEGER DEFAULT 1,
  available_slots JSONB DEFAULT '[]'::JSONB,
  maintenance_schedule JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_resources_clinic ON public.clinic_resources(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_resources_type ON public.clinic_resources(resource_type);

ALTER TABLE public.clinic_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff view resources"
  ON public.clinic_resources
  FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM public.clinic_staff WHERE user_id = auth.uid()));

CREATE POLICY "Clinic admins manage resources"
  ON public.clinic_resources
  FOR ALL
  USING (clinic_id IN (SELECT id FROM public.clinics WHERE created_by = auth.uid()));

-- Resource allocation tracking
CREATE TABLE IF NOT EXISTS public.resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.clinic_resources(id) ON DELETE CASCADE,
  allocated_at TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER NOT NULL,
  released_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_resource_allocations_appointment ON public.resource_allocations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_resource_allocations_resource ON public.resource_allocations(resource_id);

ALTER TABLE public.resource_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff view allocations"
  ON public.resource_allocations
  FOR SELECT
  USING (resource_id IN (SELECT id FROM public.clinic_resources WHERE clinic_id IN (SELECT clinic_id FROM public.clinic_staff WHERE user_id = auth.uid())));

-- Clinic inventory
CREATE TABLE IF NOT EXISTS public.clinic_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_category TEXT CHECK (item_category IN ('medication', 'supplies', 'equipment', 'consumables')),
  current_stock INTEGER DEFAULT 0,
  min_stock_threshold INTEGER DEFAULT 10,
  unit_cost DECIMAL(10,2),
  supplier_info JSONB DEFAULT '{}'::JSONB,
  last_restocked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_inventory_clinic ON public.clinic_inventory(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_inventory_category ON public.clinic_inventory(item_category);

ALTER TABLE public.clinic_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff view inventory"
  ON public.clinic_inventory
  FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM public.clinic_staff WHERE user_id = auth.uid()));

CREATE POLICY "Clinic admins manage inventory"
  ON public.clinic_inventory
  FOR ALL
  USING (clinic_id IN (SELECT id FROM public.clinics WHERE created_by = auth.uid()));

-- Auto-sync trigger: When appointment created → Update clinic metrics and allocate resources
CREATE OR REPLACE FUNCTION public.sync_appointment_to_clinic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allocate room resource automatically (if available)
  IF NEW.clinic_id IS NOT NULL THEN
    INSERT INTO public.resource_allocations (appointment_id, resource_id, duration_minutes)
    SELECT NEW.id, r.id, COALESCE(NEW.duration_minutes, 30)
    FROM public.clinic_resources r
    WHERE r.clinic_id = NEW.clinic_id
      AND r.resource_type = 'room'
      AND r.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.resource_allocations ra
        WHERE ra.resource_id = r.id
          AND ra.released_at IS NULL
          AND ra.allocated_at BETWEEN (NEW.scheduled_at - INTERVAL '15 minutes') 
                                  AND (NEW.scheduled_at + (COALESCE(NEW.duration_minutes, 30) || ' minutes')::INTERVAL)
      )
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER appointment_created_sync
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.sync_appointment_to_clinic();

-- Low stock alert trigger
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.current_stock <= NEW.min_stock_threshold THEN
    -- Insert notification for clinic admins
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    SELECT 
      cs.user_id,
      'low_stock',
      'Low Stock Alert',
      'Low stock alert: ' || NEW.item_name || ' (' || NEW.current_stock || ' remaining)',
      jsonb_build_object('inventory_id', NEW.id, 'clinic_id', NEW.clinic_id)
    FROM public.clinic_staff cs
    WHERE cs.clinic_id = NEW.clinic_id 
      AND cs.role IN ('admin', 'manager')
      AND cs.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER inventory_low_stock_check
AFTER INSERT OR UPDATE OF current_stock ON public.clinic_inventory
FOR EACH ROW
EXECUTE FUNCTION public.check_low_stock();