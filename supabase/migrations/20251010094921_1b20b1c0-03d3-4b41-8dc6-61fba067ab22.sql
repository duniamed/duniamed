-- Grant master admin access to specified users
-- infoduniamed@gmail.com
INSERT INTO public.user_roles (user_id, role, granted_by)
VALUES ('e44a2161-9816-4827-bc51-2610fe9297ad'::UUID, 'admin', 'e44a2161-9816-4827-bc51-2610fe9297ad'::UUID)
ON CONFLICT (user_id, role) DO NOTHING;

-- tatadoco64@gmail.com
INSERT INTO public.user_roles (user_id, role, granted_by)
VALUES ('ede613d2-f1e1-455e-851f-cc67366736d5'::UUID, 'admin', 'ede613d2-f1e1-455e-851f-cc67366736d5'::UUID)
ON CONFLICT (user_id, role) DO NOTHING;

-- Log admin grants in security audit log
INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id, metadata)
VALUES 
  ('e44a2161-9816-4827-bc51-2610fe9297ad'::UUID, 'grant_master_admin', 'user_roles', 'e44a2161-9816-4827-bc51-2610fe9297ad'::TEXT, '{"granted_via": "migration", "email": "infoduniamed@gmail.com"}'::jsonb),
  ('ede613d2-f1e1-455e-851f-cc67366736d5'::UUID, 'grant_master_admin', 'user_roles', 'ede613d2-f1e1-455e-851f-cc67366736d5'::TEXT, '{"granted_via": "migration", "email": "tatadoco64@gmail.com"}'::jsonb);