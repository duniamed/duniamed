# Master Admin Setup Guide

## Overview

The DuniaMed platform uses a secure role-based access control (RBAC) system where admin privileges are stored in a separate `user_roles` table, not in the user profiles. This prevents privilege escalation attacks.

## Granting Master Admin Access

### Option 1: Using Supabase SQL Editor (Recommended for Initial Setup)

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following query to grant admin access to a user:

```sql
SELECT grant_master_admin('USER_ID_HERE'::UUID, NULL);
```

Replace `USER_ID_HERE` with the actual user ID (UUID) from the `auth.users` or `profiles` table.

**To find a user's ID:**

```sql
SELECT id, email, first_name, last_name 
FROM profiles 
WHERE email = 'admin@example.com';
```

### Option 2: Using the Admin UI (After Initial Setup)

Once you have at least one admin user:

1. Log in as an admin user
2. Navigate to `/admin/users`
3. Search for a user by email
4. Click "Grant Admin" to give them master admin access

## Revoking Admin Access

### Using SQL:

```sql
SELECT revoke_admin_role('USER_ID_HERE'::UUID);
```

### Using Admin UI:

1. Go to `/admin/users`
2. Find the user in the "Current System Admins" table
3. Click "Revoke" to remove their admin access

**Note:** You cannot revoke your own admin access if you are the last admin.

## Admin Features

Master admins have access to:

- **Admin Panel** (`/admin/dashboard`) - System statistics and specialist verification
- **User Management** (`/admin/users`) - Grant/revoke admin access
- **Audit Logs** (`/admin/audit-logs`) - View all security events
- **Session Management** (`/admin/sessions`) - Monitor active sessions
- **Implementation Status** (`/admin/implementation-status`) - Feature tracking
- **Moderation Center** (`/admin/moderation`) - Content moderation
- **Legal Archives** (`/admin/legal-archives`) - Compliance documents
- **APM Monitoring** (`/admin/apm-monitoring`) - Performance metrics

## Security Features

### Audit Logging

All admin actions are logged in the `security_audit_log` table:

- When admin role is granted
- When admin role is revoked
- Who performed the action
- Timestamp of the action

### Role Expiration

Admin roles can optionally have expiration dates:

```sql
-- Grant admin access that expires in 90 days
INSERT INTO user_roles (user_id, role, granted_by, expires_at)
VALUES (
  'USER_ID_HERE'::UUID,
  'admin',
  auth.uid(),
  NOW() + INTERVAL '90 days'
);
```

### Last Admin Protection

The system prevents the last admin from being removed to avoid lockout situations.

## Checking Admin Status

### In SQL:

```sql
-- Check if a user has admin role
SELECT has_role('USER_ID_HERE'::UUID, 'admin');

-- List all current admins
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  ur.granted_at,
  ur.expires_at
FROM user_roles ur
JOIN profiles p ON p.id = ur.user_id
WHERE ur.role = 'admin'
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
```

### In Application Code:

The `useAuth()` hook provides `isAdmin` boolean:

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { isAdmin } = useAuth();
  
  if (!isAdmin) {
    return <div>Access Denied</div>;
  }
  
  return <div>Admin Content</div>;
}
```

## Troubleshooting

### Problem: No admins exist

**Solution:** Use SQL Editor to grant admin to the first user:

```sql
-- Find your user ID
SELECT id FROM profiles WHERE email = 'your@email.com';

-- Grant admin (use NULL as granter for bootstrap)
SELECT grant_master_admin('YOUR_USER_ID'::UUID, NULL);
```

### Problem: TypeScript errors about user_roles

**Solution:** Regenerate Supabase types:

```bash
npm run supabase:generate-types
```

### Problem: Admin can't access admin pages

**Checklist:**
1. Verify role exists in `user_roles` table
2. Check `expires_at` is NULL or future date
3. Log out and log back in to refresh role cache
4. Check browser console for errors

## Best Practices

1. **Minimum Admins**: Keep the number of master admins small (2-3 trusted individuals)
2. **Audit Regularly**: Review `security_audit_log` for suspicious activity
3. **Use Expiration**: Set expiration dates for temporary admin access
4. **Document Actions**: Keep an external log of why admin access was granted
5. **Backup Admin**: Always have at least 2 active admins to prevent lockout

## Security Considerations

- Admin roles are checked server-side via RLS policies
- The `has_role()` function uses `SECURITY DEFINER` to bypass RLS recursion
- Never store admin status in localStorage or client-side state
- All admin actions are audited in `security_audit_log`
- Admin role grants require existing admin privileges (except bootstrap)

## API Reference

### Functions

#### `grant_master_admin(_user_id UUID, _granted_by UUID)`
Grants admin role to a user. Requires admin privileges.

**Parameters:**
- `_user_id`: UUID of user to grant admin to
- `_granted_by`: UUID of admin granting access (optional, defaults to current user)

**Returns:** Boolean (true on success)

#### `revoke_admin_role(_user_id UUID, _revoked_by UUID)`
Revokes admin role from a user. Requires admin privileges.

**Parameters:**
- `_user_id`: UUID of user to revoke admin from
- `_revoked_by`: UUID of admin revoking access (optional, defaults to current user)

**Returns:** Boolean (true on success)

**Throws:**
- Error if trying to remove the last admin
- Error if non-admin tries to revoke

#### `has_role(_user_id UUID, _role app_role)`
Checks if a user has a specific role.

**Parameters:**
- `_user_id`: UUID of user to check
- `_role`: Role to check ('admin', 'moderator', 'user')

**Returns:** Boolean (true if user has role)

---

**Last Updated:** 2025-10-04
