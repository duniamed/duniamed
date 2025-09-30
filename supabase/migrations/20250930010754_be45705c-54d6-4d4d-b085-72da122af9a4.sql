-- RLS Policies for clinics
CREATE POLICY "Anyone can view active clinics" ON public.clinics FOR SELECT USING (is_active = true);
CREATE POLICY "Clinic creators can update their clinics" ON public.clinics FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can create clinics" ON public.clinics FOR INSERT WITH CHECK (created_by = auth.uid());

-- RLS Policies for clinic_staff
CREATE POLICY "Clinic staff can view own clinic staff" ON public.clinic_staff FOR SELECT USING (
  clinic_id IN (SELECT id FROM public.clinics WHERE created_by = auth.uid())
  OR user_id = auth.uid()
);
CREATE POLICY "Clinic owners can manage staff" ON public.clinic_staff FOR ALL USING (
  clinic_id IN (SELECT id FROM public.clinics WHERE created_by = auth.uid())
);

-- RLS Policies for SOAP notes
CREATE POLICY "Patients can view own SOAP notes" ON public.soap_notes FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Specialists can view their SOAP notes" ON public.soap_notes FOR SELECT USING (specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));
CREATE POLICY "Specialists can create SOAP notes" ON public.soap_notes FOR INSERT WITH CHECK (specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));
CREATE POLICY "Specialists can update their SOAP notes" ON public.soap_notes FOR UPDATE USING (specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));

-- RLS Policies for payments
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (
  payer_id = auth.uid() 
  OR payee_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view non-flagged reviews" ON public.reviews FOR SELECT USING (is_flagged = false);
CREATE POLICY "Patients can create reviews for their appointments" ON public.reviews FOR INSERT WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Patients can update own reviews" ON public.reviews FOR UPDATE USING (patient_id = auth.uid());
CREATE POLICY "Specialists can respond to their reviews" ON public.reviews FOR UPDATE USING (specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid()));

-- RLS Policies for favorites
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Users can remove favorites" ON public.favorites FOR DELETE USING (patient_id = auth.uid());

-- RLS Policies for family_members
CREATE POLICY "Users can view own family members" ON public.family_members FOR SELECT USING (primary_user_id = auth.uid());
CREATE POLICY "Users can add family members" ON public.family_members FOR INSERT WITH CHECK (primary_user_id = auth.uid());
CREATE POLICY "Users can update own family members" ON public.family_members FOR UPDATE USING (primary_user_id = auth.uid());
CREATE POLICY "Users can delete own family members" ON public.family_members FOR DELETE USING (primary_user_id = auth.uid());

-- RLS Policies for consent_records
CREATE POLICY "Users can view own consent records" ON public.consent_records FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create consent records" ON public.consent_records FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for audit_logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own sessions" ON public.user_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own sessions" ON public.user_sessions FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for availability_schedules
CREATE POLICY "Anyone can view active specialist availability" ON public.availability_schedules FOR SELECT USING (is_active = true);
CREATE POLICY "Specialists can manage own availability" ON public.availability_schedules FOR ALL USING (
  specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
);

-- RLS Policies for specialist_time_off
CREATE POLICY "Anyone can view specialist time off" ON public.specialist_time_off FOR SELECT USING (true);
CREATE POLICY "Specialists can manage own time off" ON public.specialist_time_off FOR ALL USING (
  specialist_id IN (SELECT id FROM public.specialists WHERE user_id = auth.uid())
);