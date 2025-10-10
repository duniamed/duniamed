-- Phase 2.1: Patient ID System Implementation
-- Add patient_number columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS patient_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS patient_number_counter BIGINT;

-- Create function to generate patient IDs (format: PAT-2025-000001)
CREATE OR REPLACE FUNCTION generate_patient_number()
RETURNS TEXT AS $$
DECLARE
  next_num BIGINT;
  year TEXT;
BEGIN
  year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get the next counter value
  SELECT COALESCE(MAX(patient_number_counter), 0) + 1 
  INTO next_num 
  FROM profiles 
  WHERE role = 'patient';
  
  RETURN 'PAT-' || year || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-assign patient number
CREATE OR REPLACE FUNCTION assign_patient_number_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'patient' AND NEW.patient_number IS NULL THEN
    NEW.patient_number := generate_patient_number();
    NEW.patient_number_counter := (
      SELECT COALESCE(MAX(patient_number_counter), 0) + 1 
      FROM profiles 
      WHERE role = 'patient'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign patient number on patient profile creation
DROP TRIGGER IF EXISTS assign_patient_number ON profiles;
CREATE TRIGGER assign_patient_number
BEFORE INSERT ON profiles
FOR EACH ROW
WHEN (NEW.role = 'patient')
EXECUTE FUNCTION assign_patient_number_trigger();

-- Phase 2.2: Doctor/Clinic Can Create Patient Users
-- Add columns to track who created the patient account
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_by_specialist_id UUID REFERENCES specialists(id),
ADD COLUMN IF NOT EXISTS created_by_clinic_id UUID REFERENCES clinics(id),
ADD COLUMN IF NOT EXISTS can_self_login BOOLEAN DEFAULT true;

-- Phase 2.3: Patient Care Team Table
CREATE TABLE IF NOT EXISTS patient_care_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  specialist_id UUID REFERENCES specialists(id) ON DELETE SET NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('primary_care', 'specialist', 'consultant', 'care_coordinator')),
  relationship_type TEXT NOT NULL DEFAULT 'active' CHECK (relationship_type IN ('active', 'past', 'consulting', 'inactive')),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on patient_care_team
ALTER TABLE patient_care_team ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_care_team
CREATE POLICY "Patients can view their own care team"
ON patient_care_team FOR SELECT
USING (patient_id = auth.uid());

CREATE POLICY "Specialists can view care teams they're part of"
ON patient_care_team FOR SELECT
USING (
  specialist_id IN (
    SELECT id FROM specialists WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Specialists can manage their care team memberships"
ON patient_care_team FOR ALL
USING (
  specialist_id IN (
    SELECT id FROM specialists WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Clinic staff can manage care teams for their clinic patients"
ON patient_care_team FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_care_team_patient ON patient_care_team(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_care_team_specialist ON patient_care_team(specialist_id);
CREATE INDEX IF NOT EXISTS idx_patient_care_team_clinic ON patient_care_team(clinic_id);
CREATE INDEX IF NOT EXISTS idx_profiles_patient_number ON profiles(patient_number) WHERE role = 'patient';

-- Phase 2.4: Add patient_number reference columns to related tables
-- This allows searching by patient number across all clinical features
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_number TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS patient_number TEXT;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS patient_number TEXT;
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS patient_number TEXT;

-- Create indexes for patient_number searches
CREATE INDEX IF NOT EXISTS idx_appointments_patient_number ON appointments(patient_number);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_number ON prescriptions(patient_number);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_number ON medical_records(patient_number);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_number ON lab_orders(patient_number);

-- Backfill existing patient_number references
UPDATE appointments SET patient_number = (
  SELECT patient_number FROM profiles WHERE profiles.id = appointments.patient_id
) WHERE patient_number IS NULL;

UPDATE prescriptions SET patient_number = (
  SELECT patient_number FROM profiles WHERE profiles.id = prescriptions.patient_id
) WHERE patient_number IS NULL;

UPDATE medical_records SET patient_number = (
  SELECT patient_number FROM profiles WHERE profiles.id = medical_records.patient_id
) WHERE patient_number IS NULL;

UPDATE lab_orders SET patient_number = (
  SELECT patient_number FROM profiles WHERE profiles.id = lab_orders.patient_id
) WHERE patient_number IS NULL;