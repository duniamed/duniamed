-- Create storage bucket for medical records
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-records',
  'medical-records',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/dicom']
);

-- Create storage policies for medical records
CREATE POLICY "Patients can upload their own medical records"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-records' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Patients can view their own medical records"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-records' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Specialists can view patient medical records for their appointments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-records' AND
  EXISTS (
    SELECT 1 FROM appointments a
    JOIN specialists s ON s.id = a.specialist_id
    WHERE s.user_id = auth.uid()
    AND a.patient_id::text = (storage.foldername(name))[1]
  )
);

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
);

-- Create storage policies for avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add realtime publication for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Update medical_records table to store file URLs
ALTER TABLE medical_records
ALTER COLUMN file_url SET NOT NULL;

COMMENT ON COLUMN medical_records.file_url IS 'Storage path to the file in the medical-records bucket';