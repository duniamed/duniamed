-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Appointment reminder batch (runs every hour)
SELECT cron.schedule(
  'appointment-reminder-batch',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url:='https://knybxihimqrqwzkdeaio.supabase.co/functions/v1/appointment-reminder-batch',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueWJ4aWhpbXFycXd6a2RlYWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODY4MTgsImV4cCI6MjA3NDc2MjgxOH0.Sw-MGFnleR4fH6n-QOjL6Ig1PbtrNPbCYLe0Wn8b_h4"}'::jsonb,
    body:='{"time": "' || now()::text || '"}'::jsonb
  ) as request_id;
  $$
);

-- 2. Calendar token refresh (runs every 30 minutes)
SELECT cron.schedule(
  'calendar-token-refresh',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT net.http_post(
    url:='https://knybxihimqrqwzkdeaio.supabase.co/functions/v1/calendar-token-refresh',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueWJ4aWhpbXFycXd6a2RlYWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODY4MTgsImV4cCI6MjA3NDc2MjgxOH0.Sw-MGFnleR4fH6n-QOjL6Ig1PbtrNPbCYLe0Wn8b_h4"}'::jsonb,
    body:='{"time": "' || now()::text || '"}'::jsonb
  ) as request_id;
  $$
);

-- 3. Credential auto-reverification (runs daily at 2 AM)
SELECT cron.schedule(
  'credential-auto-reverify',
  '0 2 * * *', -- Daily at 2:00 AM
  $$
  SELECT net.http_post(
    url:='https://knybxihimqrqwzkdeaio.supabase.co/functions/v1/credential-auto-reverify',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueWJ4aWhpbXFycXd6a2RlYWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODY4MTgsImV4cCI6MjA3NDc2MjgxOH0.Sw-MGFnleR4fH6n-QOjL6Ig1PbtrNPbCYLe0Wn8b_h4"}'::jsonb,
    body:='{"time": "' || now()::text || '"}'::jsonb
  ) as request_id;
  $$
);

-- 4. Calculate and distribute revenue splits (runs daily at 1 AM)
SELECT cron.schedule(
  'calculate-revenue-splits',
  '0 1 * * *', -- Daily at 1:00 AM
  $$
  SELECT net.http_post(
    url:='https://knybxihimqrqwzkdeaio.supabase.co/functions/v1/calculate-and-distribute-revenue-split',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueWJ4aWhpbXFycXd6a2RlYWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODY4MTgsImV4cCI6MjA3NDc2MjgxOH0.Sw-MGFnleR4fH6n-QOjL6Ig1PbtrNPbCYLe0Wn8b_h4"}'::jsonb,
    body:='{"time": "' || now()::text || '"}'::jsonb
  ) as request_id;
  $$
);

-- 5. Sync RPM devices reconciliation (runs every 15 minutes)
SELECT cron.schedule(
  'sync-rpm-devices-reconciliation',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT net.http_post(
    url:='https://knybxihimqrqwzkdeaio.supabase.co/functions/v1/sync-rpm-devices',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueWJ4aWhpbXFycXd6a2RlYWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODY4MTgsImV4cCI6MjA3NDc2MjgxOH0.Sw-MGFnleR4fH6n-QOjL6Ig1PbtrNPbCYLe0Wn8b_h4"}'::jsonb,
    body:='{"time": "' || now()::text || '"}'::jsonb
  ) as request_id;
  $$
);