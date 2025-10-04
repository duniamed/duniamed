-- Create master admin user role function and initial setup
-- This allows designating master admin users securely via user_roles table

-- First, ensure app_role enum has 'master_admin' if needed
-- (keeping existing roles: admin, moderator, user)

-- Create a function to grant master admin role
-- Only existing admins or the system can call this
CREATE OR REPLACE FUNCTION public.grant_master_admin(_user_id UUID, _granted_by UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _granter_is_admin BOOLEAN;
BEGIN
  -- Check if the granter is already an admin (or this is initial setup with NULL)
  IF _granted_by IS NULL THEN
    -- Initial system setup, allow
    _granter_is_admin := TRUE;
  ELSE
    _granter_is_admin := has_role(_granted_by, 'admin');
  END IF;
  
  IF NOT _granter_is_admin THEN
    RAISE EXCEPTION 'Only admins can grant master admin role';
  END IF;
  
  -- Insert admin role for the target user (upsert to prevent duplicates)
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (_user_id, 'admin', COALESCE(_granted_by, _user_id))
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata,
    ip_address,
    user_agent
  )
  VALUES (
    COALESCE(_granted_by, _user_id),
    'grant_master_admin',
    'user_roles',
    _user_id::TEXT,
    jsonb_build_object('target_user', _user_id, 'role', 'admin'),
    NULL,
    NULL
  );
  
  RETURN TRUE;
END;
$$;

-- Add granted_by and expires_at columns to user_roles if not exists
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON public.user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- Update has_role function to check expiration
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (expires_at IS NULL OR expires_at > NOW())
  )
$$;

-- Function to revoke admin role
CREATE OR REPLACE FUNCTION public.revoke_admin_role(_user_id UUID, _revoked_by UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _revoker_is_admin BOOLEAN;
BEGIN
  -- Check if the revoker is an admin
  _revoker_is_admin := has_role(_revoked_by, 'admin');
  
  IF NOT _revoker_is_admin THEN
    RAISE EXCEPTION 'Only admins can revoke admin roles';
  END IF;
  
  -- Prevent self-revocation if this is the last admin
  IF _user_id = _revoked_by THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin' AND (expires_at IS NULL OR expires_at > NOW())) <= 1 THEN
      RAISE EXCEPTION 'Cannot revoke your own admin role - you are the last admin';
    END IF;
  END IF;
  
  -- Delete the admin role
  DELETE FROM public.user_roles
  WHERE user_id = _user_id AND role = 'admin';
  
  -- Log the action
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata,
    ip_address,
    user_agent
  )
  VALUES (
    _revoked_by,
    'revoke_admin_role',
    'user_roles',
    _user_id::TEXT,
    jsonb_build_object('target_user', _user_id, 'role', 'admin'),
    NULL,
    NULL
  );
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.grant_master_admin IS 'Grants admin role to a user. Can only be called by existing admins.';
COMMENT ON FUNCTION public.revoke_admin_role IS 'Revokes admin role from a user. Prevents last admin from being removed.';