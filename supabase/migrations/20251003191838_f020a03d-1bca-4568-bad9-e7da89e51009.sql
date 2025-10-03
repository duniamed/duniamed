-- P0 CRITICAL: Add RLS Policies for Tables Missing Them (Final Corrected Version)
-- Identified by Supabase Linter as having RLS enabled but no policies

-- 1. connector_sync_logs - System tracks connector sync activity
CREATE POLICY "Users view own connector sync logs"
  ON connector_sync_logs FOR SELECT
  USING (
    connector_id IN (
      SELECT id FROM connector_configurations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create sync logs"
  ON connector_sync_logs FOR INSERT
  WITH CHECK (true);

-- 2. engagement_analytics - Tracks patient/provider engagement
CREATE POLICY "Patients view own engagement analytics"
  ON engagement_analytics FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Clinic staff view campaign analytics"
  ON engagement_analytics FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM engagement_campaigns
      WHERE clinic_id IN (
        SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can create engagement analytics"
  ON engagement_analytics FOR INSERT
  WITH CHECK (true);

-- 3. role_permissions - Critical for RBAC
CREATE POLICY "Anyone can view role permissions"
  ON role_permissions FOR SELECT
  USING (true);

CREATE POLICY "Admins manage role permissions"
  ON role_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- 4. support_escalations - Support ticket escalation tracking
CREATE POLICY "Users view escalations they're involved in"
  ON support_escalations FOR SELECT
  USING (
    escalated_by = auth.uid() OR
    escalated_to = auth.uid() OR
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can escalate tickets"
  ON support_escalations FOR INSERT
  WITH CHECK (escalated_by = auth.uid());

CREATE POLICY "Assigned staff can update escalations"
  ON support_escalations FOR UPDATE
  USING (escalated_to = auth.uid());

-- 5. team_conversation_participants - Team chat participants
CREATE POLICY "Participants view own conversations"
  ON team_conversation_participants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can join conversations"
  ON team_conversation_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave conversations"
  ON team_conversation_participants FOR DELETE
  USING (user_id = auth.uid());

-- Fix Security Definer View: clinics_public
-- Drop and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS clinics_public CASCADE;

CREATE VIEW clinics_public AS
SELECT 
  c.id,
  c.name,
  c.description,
  c.logo_url,
  c.clinic_type,
  c.specialties,
  c.city,
  c.state,
  c.country,
  c.postal_code,
  c.address_line1,
  c.phone,
  c.email,
  c.website,
  c.operating_hours,
  c.languages_supported,
  c.is_active,
  c.created_at,
  c.tagline,
  c.mission_statement,
  c.cover_image_url,
  CONCAT(LOWER(REGEXP_REPLACE(c.name, '[^a-zA-Z0-9]+', '-', 'g')), '-', LEFT(c.id::text, 8)) as slug,
  AVG(r.rating) as average_rating,
  COUNT(DISTINCT cs.user_id) as staff_count
FROM clinics c
LEFT JOIN reviews r ON r.specialist_id IN (
  SELECT s.id FROM specialists s
  JOIN clinic_staff cs2 ON cs2.user_id = s.user_id
  WHERE cs2.clinic_id = c.id
)
LEFT JOIN clinic_staff cs ON cs.clinic_id = c.id
WHERE c.is_active = true
GROUP BY c.id;