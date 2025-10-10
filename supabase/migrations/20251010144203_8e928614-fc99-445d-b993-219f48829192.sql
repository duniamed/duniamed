-- Phase 3: Integration configs table
CREATE TABLE IF NOT EXISTS integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  credentials JSONB,
  settings JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT integration_configs_target_check CHECK (
    (user_id IS NOT NULL AND clinic_id IS NULL) OR
    (user_id IS NULL AND clinic_id IS NOT NULL)
  )
);

CREATE INDEX idx_integrations_type ON integration_configs(integration_type);
CREATE INDEX idx_integrations_user ON integration_configs(user_id);
CREATE INDEX idx_integrations_clinic ON integration_configs(clinic_id);

ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own integrations"
ON integration_configs
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR 
  clinic_id IN (SELECT id FROM clinics WHERE created_by = auth.uid())
);

-- Phase 4: Virtual clinic enhancements
ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS header_image_url TEXT,
ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

CREATE TABLE IF NOT EXISTS clinic_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clinic_photos_clinic ON clinic_photos(clinic_id);

ALTER TABLE clinic_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clinic photos"
ON clinic_photos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Clinic owners manage photos"
ON clinic_photos
FOR ALL
TO authenticated
USING (clinic_id IN (SELECT id FROM clinics WHERE created_by = auth.uid()));

-- Extend reviews table for clinics
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);

-- Drop existing constraint if it exists and recreate
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_target_check;

ALTER TABLE reviews 
ADD CONSTRAINT reviews_target_check CHECK (
  (specialist_id IS NOT NULL AND clinic_id IS NULL) OR
  (specialist_id IS NULL AND clinic_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_reviews_clinic ON reviews(clinic_id);

-- Profile import history
CREATE TABLE IF NOT EXISTS profile_import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  imported_data JSONB,
  imported_at TIMESTAMPTZ DEFAULT now(),
  imported_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_import_history_clinic ON profile_import_history(clinic_id);

ALTER TABLE profile_import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic owners view import history"
ON profile_import_history
FOR SELECT
TO authenticated
USING (clinic_id IN (SELECT id FROM clinics WHERE created_by = auth.uid()));

-- Create clinic-media storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clinic-media', 'clinic-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for clinic-media
CREATE POLICY "Anyone can view clinic media"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'clinic-media');

CREATE POLICY "Clinic owners can upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'clinic-media' AND
  auth.uid() IN (SELECT created_by FROM clinics)
);

CREATE POLICY "Clinic owners can update their media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'clinic-media' AND
  auth.uid() IN (SELECT created_by FROM clinics)
);