-- Enable pg_cron for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule calendar token refresh every 30 minutes
SELECT cron.schedule(
  'refresh-calendar-tokens',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT net.http_post(
    url := 'https://knybxihimqrqwzkdeaio.supabase.co/functions/v1/calendar-token-refresh',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueWJ4aWhpbXFycXd6a2RlYWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODY4MTgsImV4cCI6MjA3NDc2MjgxOH0.Sw-MGFnleR4fH6n-QOjL6Ig1PbtrNPbCYLe0Wn8b_h4"}'::jsonb
  ) as request_id;
  $$
);

-- Add booking attempt tracking for analytics
CREATE TABLE IF NOT EXISTS booking_conversion_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id),
  search_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  specialist_id UUID,
  slot_viewed_at TIMESTAMP WITH TIME ZONE,
  hold_created_at TIMESTAMP WITH TIME ZONE,
  booking_completed_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  conversion_time_seconds INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (booking_completed_at - search_timestamp))::integer
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE booking_conversion_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own metrics
CREATE POLICY "Users view own conversion metrics"
ON booking_conversion_metrics
FOR SELECT
USING (patient_id = auth.uid());

-- Add index for analytics queries
CREATE INDEX idx_booking_conversion_patient ON booking_conversion_metrics(patient_id);
CREATE INDEX idx_booking_conversion_time ON booking_conversion_metrics(created_at);

COMMENT ON TABLE booking_conversion_metrics IS 'Tracks booking funnel: search -> view -> hold -> book. Helps optimize conversion rates.';