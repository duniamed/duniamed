-- Add advanced search filter fields to specialists table
ALTER TABLE specialists 
ADD COLUMN IF NOT EXISTS conditions_treated text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS accepts_insurance boolean DEFAULT false;

-- Add time zone and insurance preferences to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_insurance text,
ADD COLUMN IF NOT EXISTS preferred_timezone text DEFAULT 'UTC';

-- Create conditions_treated lookup table for common conditions
CREATE TABLE IF NOT EXISTS conditions_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_name text NOT NULL UNIQUE,
  category text NOT NULL,
  specialty_tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Insert common medical conditions
INSERT INTO conditions_catalog (condition_name, category, specialty_tags) VALUES
  ('Hypertension', 'Cardiovascular', ARRAY['Cardiology', 'Internal Medicine']),
  ('Diabetes Type 2', 'Endocrine', ARRAY['Endocrinology', 'Internal Medicine']),
  ('Asthma', 'Respiratory', ARRAY['Pulmonology', 'Internal Medicine']),
  ('Depression', 'Mental Health', ARRAY['Psychiatry', 'Psychology']),
  ('Anxiety Disorders', 'Mental Health', ARRAY['Psychiatry', 'Psychology']),
  ('Arthritis', 'Musculoskeletal', ARRAY['Rheumatology', 'Orthopedics']),
  ('Back Pain', 'Musculoskeletal', ARRAY['Orthopedics', 'Physical Medicine']),
  ('Migraine', 'Neurological', ARRAY['Neurology', 'Internal Medicine']),
  ('GERD', 'Digestive', ARRAY['Gastroenterology', 'Internal Medicine']),
  ('Skin Conditions', 'Dermatological', ARRAY['Dermatology'])
ON CONFLICT (condition_name) DO NOTHING;

-- Create insurance_networks table
CREATE TABLE IF NOT EXISTS insurance_networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_name text NOT NULL UNIQUE,
  country text NOT NULL,
  provider_type text,
  created_at timestamptz DEFAULT now()
);

-- Insert common insurance networks
INSERT INTO insurance_networks (network_name, country, provider_type) VALUES
  ('Blue Cross Blue Shield', 'US', 'PPO/HMO'),
  ('UnitedHealthcare', 'US', 'PPO/HMO'),
  ('Aetna', 'US', 'PPO/HMO'),
  ('Cigna', 'US', 'PPO/HMO'),
  ('NHS', 'UK', 'Public'),
  ('Private Health Insurance', 'AU', 'Private'),
  ('Medicare', 'US', 'Government')
ON CONFLICT (network_name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE conditions_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_networks ENABLE ROW LEVEL SECURITY;

-- Public read access for lookup tables
CREATE POLICY "Anyone can view conditions catalog"
  ON conditions_catalog FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view insurance networks"
  ON insurance_networks FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_specialists_conditions ON specialists USING GIN(conditions_treated);
CREATE INDEX IF NOT EXISTS idx_specialists_timezone ON specialists(timezone);
CREATE INDEX IF NOT EXISTS idx_specialists_insurance ON specialists(accepts_insurance) WHERE accepts_insurance = true;
CREATE INDEX IF NOT EXISTS idx_conditions_specialty ON conditions_catalog USING GIN(specialty_tags);