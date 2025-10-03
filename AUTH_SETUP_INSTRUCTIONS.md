# Admin Setup & Auth Configuration

## 🔐 Step 1: Create Your Admin Account

1. **Sign up**: Go to `/auth?mode=signup` and create your account
2. **Get your User ID**: After signing up, check your browser console or go to Supabase Dashboard → Authentication → Users
3. **Grant Admin Role**: Run this SQL in Supabase SQL Editor:
   ```sql
   INSERT INTO public.user_roles (user_id, role) 
   VALUES ('YOUR-USER-ID-HERE', 'admin');
   ```

## 🔧 Step 2: Fix Password Reset & Magic Links

### Problem
Password reset and magic links redirect to `localhost:3000` or show "requested path is invalid"

### Solution
Configure redirect URLs in Supabase:

1. Go to: **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **Site URL** to your preview URL: `https://YOUR-PROJECT.lovable.app`
3. Add to **Redirect URLs**:
   - `https://YOUR-PROJECT.lovable.app/**`
   - `https://YOUR-PROJECT.lovable.app/auth`
   - Your deployed domain (if you have one)

### For Local Development
- Site URL: `http://localhost:5173`
- Redirect URL: `http://localhost:5173/**`

## 📧 Step 3: Test Auth Features

### Password Reset
1. Go to `/auth` → Click "Forgot Password"
2. Enter email → Check inbox
3. Click reset link → Should redirect to your app

### Magic Link (Passwordless)
Enable in Supabase Dashboard → Authentication → Providers → Email → Enable "Confirm email"

## 🎯 Step 4: Admin Dashboard Access

Once your user has admin role, you can access:
- `/admin` - Admin Panel
- `/analytics` - Analytics Dashboard
- `/admin-review-visibility` - Review Management
- All clinic, specialist, and patient dashboards

## 📋 Migration Approval

The C25-C30 features need database tables. When you see the migration prompt:
1. Review the SQL
2. Click "Approve & Execute"
3. Wait for Supabase types to regenerate
4. TypeScript errors will disappear
5. Uncomment C25-C30 routes in App.tsx

## 🔍 Quick Checks

**Is admin working?**
```sql
SELECT * FROM user_roles WHERE role = 'admin';
```

**Check auth settings:**
Supabase Dashboard → Authentication → URL Configuration

**View auth logs:**
Supabase Dashboard → Authentication → Logs
