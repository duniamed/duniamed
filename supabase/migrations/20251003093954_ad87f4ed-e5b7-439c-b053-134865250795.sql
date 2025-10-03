-- C4: Redundant notifications multi-channel (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_channels') THEN
    CREATE TABLE notification_channels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'sms', 'whatsapp', 'push')),
      channel_value TEXT NOT NULL,
      is_verified BOOLEAN DEFAULT false,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(user_id, channel_type, channel_value)
    );

    ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users manage own channels"
      ON notification_channels FOR ALL
      USING (user_id = auth.uid());
      
    CREATE TRIGGER update_notification_channels_timestamp
      BEFORE UPDATE ON notification_channels
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;

-- C8: Transparency - Specialist sponsorships (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'specialist_sponsorships') THEN
    CREATE TABLE specialist_sponsorships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
      sponsorship_type TEXT NOT NULL CHECK (sponsorship_type IN ('featured', 'premium', 'promoted')),
      start_date TIMESTAMP WITH TIME ZONE NOT NULL,
      end_date TIMESTAMP WITH TIME ZONE NOT NULL,
      amount_paid NUMERIC,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    ALTER TABLE specialist_sponsorships ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Anyone view active sponsorships"
      ON specialist_sponsorships FOR SELECT
      USING (is_active = true AND now() BETWEEN start_date AND end_date);
      
    CREATE TRIGGER update_specialist_sponsorships_timestamp
      BEFORE UPDATE ON specialist_sponsorships
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;

-- C8: Fee transparency columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'specialists' AND column_name = 'fee_transparency_level') THEN
    ALTER TABLE specialists ADD COLUMN fee_transparency_level TEXT DEFAULT 'full' CHECK (fee_transparency_level IN ('full', 'range', 'hidden'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'specialists' AND column_name = 'insurance_accepted_list') THEN
    ALTER TABLE specialists ADD COLUMN insurance_accepted_list TEXT[];
  END IF;
END $$;

-- C10: Procedure answers table (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'procedure_answers') THEN
    CREATE TABLE procedure_answers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question_id UUID NOT NULL,
      answered_by UUID NOT NULL,
      answer TEXT NOT NULL,
      is_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    ALTER TABLE procedure_answers ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Anyone view answers"
      ON procedure_answers FOR SELECT
      USING (true);
      
    CREATE TRIGGER update_procedure_answers_timestamp
      BEFORE UPDATE ON procedure_answers
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;