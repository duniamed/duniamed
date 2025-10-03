-- C4 Resilience: Form autosave and bug reporting
CREATE TABLE IF NOT EXISTS form_autosaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL,
  form_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE form_autosaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own autosaves"
  ON form_autosaves FOR ALL
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  browser_info JSONB,
  screenshot_urls TEXT[],
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'wont_fix')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create bug reports"
  ON bug_reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own bug reports"
  ON bug_reports FOR SELECT
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  target_roles TEXT[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature flags"
  ON feature_flags FOR SELECT
  USING (true);

-- C6 Usability: Accessibility preferences and tutorials
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  accessibility_mode BOOLEAN DEFAULT false,
  voice_assist_enabled BOOLEAN DEFAULT false,
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'xl')),
  high_contrast BOOLEAN DEFAULT false,
  screen_reader_optimized BOOLEAN DEFAULT false,
  reduced_motion BOOLEAN DEFAULT false,
  language_preference TEXT DEFAULT 'en',
  tutorial_progress JSONB DEFAULT '{}',
  ui_mode TEXT DEFAULT 'full' CHECK (ui_mode IN ('full', 'basic', 'simplified')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
  ON user_preferences FOR ALL
  USING (user_id = auth.uid());

-- C8 Transparency: Sponsorships and paid listings
CREATE TABLE IF NOT EXISTS sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  sponsorship_type TEXT NOT NULL CHECK (sponsorship_type IN ('featured', 'promoted', 'verified_plus')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  cost NUMERIC NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  disclosure_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT sponsorship_entity CHECK (
    (specialist_id IS NOT NULL AND clinic_id IS NULL) OR
    (specialist_id IS NULL AND clinic_id IS NOT NULL)
  )
);

ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view active sponsorships"
  ON sponsorships FOR SELECT
  USING (status = 'active' AND end_date > now());

CREATE TABLE IF NOT EXISTS third_party_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  auditor_name TEXT NOT NULL,
  audit_type TEXT NOT NULL,
  audit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  certification_url TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'revoked')),
  findings_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT audit_entity CHECK (
    (specialist_id IS NOT NULL AND clinic_id IS NULL) OR
    (specialist_id IS NULL AND clinic_id IS NOT NULL)
  )
);

ALTER TABLE third_party_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view valid audits"
  ON third_party_audits FOR SELECT
  USING (status = 'valid' AND (expiry_date IS NULL OR expiry_date > now()));

-- C9 Visibility: Review moderation and flag tracking
CREATE TABLE IF NOT EXISTS review_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  flagged_by UUID REFERENCES auth.users(id),
  flag_reason TEXT NOT NULL,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('spam', 'inappropriate', 'fake', 'misleading', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'upheld', 'dismissed')),
  moderator_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can flag reviews"
  ON review_flags FOR INSERT
  WITH CHECK (flagged_by = auth.uid());

CREATE POLICY "Anyone view flag status"
  ON review_flags FOR SELECT
  USING (true);

-- C11 Freshness: Provider activity tracking
CREATE TABLE IF NOT EXISTS provider_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  last_login TIMESTAMP WITH TIME ZONE,
  last_profile_update TIMESTAMP WITH TIME ZONE,
  last_appointment TIMESTAMP WITH TIME ZONE,
  response_time_avg INTEGER,
  availability_updated_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  activity_score INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT activity_entity CHECK (
    (specialist_id IS NOT NULL AND clinic_id IS NULL) OR
    (specialist_id IS NULL AND clinic_id IS NOT NULL)
  )
);

ALTER TABLE provider_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view provider activity"
  ON provider_activity FOR SELECT
  USING (is_active = true);

CREATE POLICY "Providers update own activity"
  ON provider_activity FOR ALL
  USING (
    specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid()) OR
    clinic_id IN (SELECT id FROM clinics WHERE created_by = auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER update_form_autosaves_timestamp
  BEFORE UPDATE ON form_autosaves
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_bug_reports_timestamp
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_preferences_timestamp
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_provider_activity_timestamp
  BEFORE UPDATE ON provider_activity
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();