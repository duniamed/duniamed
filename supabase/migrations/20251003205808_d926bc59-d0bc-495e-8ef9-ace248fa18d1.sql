-- Create cache tables for search optimization
CREATE TABLE IF NOT EXISTS public.specialist_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_key TEXT NOT NULL,
  search_filters JSONB NOT NULL,
  specialist_ids UUID[] NOT NULL,
  result_count INTEGER NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_specialist_search_cache_key ON public.specialist_search_cache(search_key);
CREATE INDEX idx_specialist_search_cache_expires ON public.specialist_search_cache(expires_at);

-- Create availability cache for bulk checks
CREATE TABLE IF NOT EXISTS public.specialist_availability_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available_slots JSONB NOT NULL,
  total_slots INTEGER NOT NULL,
  booked_slots INTEGER NOT NULL,
  utilization_pct NUMERIC(5,2) NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(specialist_id, date)
);

CREATE INDEX idx_availability_cache_specialist ON public.specialist_availability_cache(specialist_id, date);
CREATE INDEX idx_availability_cache_expires ON public.specialist_availability_cache(expires_at);

-- Create message participants view for N+1 optimization
CREATE OR REPLACE VIEW public.message_conversations AS
SELECT DISTINCT
  CASE 
    WHEN m.sender_id < m.recipient_id 
    THEN m.sender_id || '-' || m.recipient_id
    ELSE m.recipient_id || '-' || m.sender_id
  END as conversation_id,
  m.sender_id,
  m.recipient_id,
  sender.first_name || ' ' || sender.last_name as sender_name,
  sender.avatar_url as sender_avatar,
  recipient.first_name || ' ' || recipient.last_name as recipient_name,
  recipient.avatar_url as recipient_avatar,
  (
    SELECT content 
    FROM public.messages m2 
    WHERE (m2.sender_id = m.sender_id AND m2.recipient_id = m.recipient_id)
       OR (m2.sender_id = m.recipient_id AND m2.recipient_id = m.sender_id)
    ORDER BY m2.created_at DESC 
    LIMIT 1
  ) as last_message,
  (
    SELECT created_at 
    FROM public.messages m2 
    WHERE (m2.sender_id = m.sender_id AND m2.recipient_id = m.recipient_id)
       OR (m2.sender_id = m.recipient_id AND m2.recipient_id = m.sender_id)
    ORDER BY m2.created_at DESC 
    LIMIT 1
  ) as last_message_at
FROM public.messages m
JOIN public.profiles sender ON sender.id = m.sender_id
JOIN public.profiles recipient ON recipient.id = m.recipient_id;

-- Function to refresh availability cache
CREATE OR REPLACE FUNCTION public.refresh_availability_cache(
  p_specialist_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date DATE;
  v_count INTEGER := 0;
BEGIN
  v_date := p_start_date;
  
  WHILE v_date <= p_end_date LOOP
    -- Delete existing cache for this date
    DELETE FROM specialist_availability_cache 
    WHERE specialist_id = p_specialist_id AND date = v_date;
    
    -- Calculate availability for this date
    WITH day_schedule AS (
      SELECT 
        start_time,
        end_time
      FROM availability_schedules
      WHERE specialist_id = p_specialist_id
        AND day_of_week = EXTRACT(DOW FROM v_date)
        AND is_active = true
    ),
    appointments_on_date AS (
      SELECT 
        scheduled_at,
        duration_minutes
      FROM appointments
      WHERE specialist_id = p_specialist_id
        AND DATE(scheduled_at) = v_date
        AND status NOT IN ('cancelled', 'no_show')
    ),
    slot_calculation AS (
      SELECT
        COUNT(*) as total_slots,
        (SELECT COUNT(*) FROM appointments_on_date) as booked_slots,
        JSONB_AGG(
          JSONB_BUILD_OBJECT(
            'start_time', start_time,
            'end_time', end_time,
            'available', NOT EXISTS (
              SELECT 1 FROM appointments_on_date a
              WHERE a.scheduled_at::TIME >= start_time
                AND a.scheduled_at::TIME < end_time
            )
          )
        ) as available_slots
      FROM day_schedule
    )
    INSERT INTO specialist_availability_cache (
      specialist_id,
      date,
      available_slots,
      total_slots,
      booked_slots,
      utilization_pct,
      cached_at,
      expires_at
    )
    SELECT
      p_specialist_id,
      v_date,
      COALESCE(sc.available_slots, '[]'::JSONB),
      COALESCE(sc.total_slots, 0),
      COALESCE(sc.booked_slots, 0),
      CASE 
        WHEN COALESCE(sc.total_slots, 0) > 0 
        THEN (COALESCE(sc.booked_slots, 0)::NUMERIC / sc.total_slots * 100)
        ELSE 0 
      END,
      NOW(),
      NOW() + INTERVAL '4 hours'
    FROM slot_calculation sc;
    
    v_count := v_count + 1;
    v_date := v_date + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION refresh_availability_cache IS 'Refreshes availability cache for a specialist for a date range';

-- Grant permissions
GRANT SELECT ON public.specialist_search_cache TO authenticated;
GRANT SELECT ON public.specialist_availability_cache TO authenticated;
GRANT SELECT ON public.message_conversations TO authenticated;