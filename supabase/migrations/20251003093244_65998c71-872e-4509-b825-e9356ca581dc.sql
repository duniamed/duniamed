-- C7: Support - CSAT ratings (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_ticket_ratings') THEN
    CREATE TABLE support_ticket_ratings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      feedback TEXT,
      rated_by UUID NOT NULL REFERENCES auth.users(id),
      rated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    ALTER TABLE support_ticket_ratings ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users rate own tickets"
      ON support_ticket_ratings FOR ALL
      USING (rated_by = auth.uid());
  END IF;
END $$;

-- C8: Transparency - Verification tracking (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'specialist_verifications') THEN
    CREATE TABLE specialist_verifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
      verification_type TEXT NOT NULL CHECK (verification_type IN ('credential', 'background', 'audit')),
      verified_by TEXT NOT NULL,
      verification_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
      expiry_date TIMESTAMP WITH TIME ZONE,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
      verification_document_url TEXT,
      attestation_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    ALTER TABLE specialist_verifications ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Anyone view active verifications"
      ON specialist_verifications FOR SELECT
      USING (status = 'active');
      
    CREATE TRIGGER update_specialist_verifications_timestamp
      BEFORE UPDATE ON specialist_verifications
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;

-- C10: Enhance verification_reminders if columns don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_reminders' AND column_name = 'reminder_sent') THEN
    ALTER TABLE verification_reminders ADD COLUMN reminder_sent BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_reminders' AND column_name = 'reminder_acknowledged') THEN
    ALTER TABLE verification_reminders ADD COLUMN reminder_acknowledged BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_reminders' AND column_name = 'acknowledged_at') THEN
    ALTER TABLE verification_reminders ADD COLUMN acknowledged_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;