-- Create pg_cron job to auto-update specialist status every 5 minutes
-- This will automatically set specialists offline if they haven't had activity in 30 minutes
SELECT cron.schedule(
  'auto-update-specialist-status',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://knybxihimqrqwzkdeaio.supabase.co/functions/v1/auto-update-specialist-status',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);