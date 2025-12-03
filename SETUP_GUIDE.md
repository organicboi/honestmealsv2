# 🎯 RBAC Setup - 2 Simple Steps

## ⚡ The Problem You Had

**Error:** `type "user_role" does not exist`

**Cause:** Your database still had the old enum-based role column in the `profiles` table.

---

## ✅ The Solution

### Step 1: Run SQL File (5 minutes)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Open file: `database/COMPLETE_RBAC_SETUP.sql`
4. **Copy ALL the content**
5. **Paste into SQL Editor**
6. Click **Run**
7. ✅ You'll see success messages at the bottom

### Step 2: Enable Auth Hook (2 minutes)

1. In Supabase Dashboard, go to: **Authentication** → **Hooks**
2. Click **"Create a new hook"**
3. Settings:
   - **Hook type:** Custom Access Token
   - **Function:** `custom_access_token_hook`
4. Click **Enable**
5. ✅ Done!

---

## 🧪 Test It

### Try Signing Up Again

1. Go to your app: `http://localhost:3000/sign-up`
2. Enter email and password
3. Click Sign Up
4. ✅ Should work now!

### Verify in Supabase

```sql
-- Check roles exist
SELECT * FROM public.roles;

-- Check your user got assigned a role
SELECT 
  u.email,
  r.name as role
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id;
```

You should see your user with `standard_user` role!

---

## 📝 What Changed

### Before (❌ Broken)
```
profiles table had:
  - role column with user_role enum ← This was the problem!
```

### After (✅ Fixed)
```
New structure:
  - roles table (stores: standard_user, admin, moderator, etc.)
  - user_roles table (maps users to roles)
  - No enum type!
  - Roles injected into JWT automatically
```

---

## 🆘 Still Having Issues?

### Check 1: Did the SQL run successfully?
Look for these success messages in SQL Editor after running:
- ✓ All Roles: (shows 5 roles)
- ✓ Trigger Status: (shows on_auth_user_created)
- ✓ Users and Roles: (shows any existing users)

### Check 2: Is the hook enabled?
Go to **Authentication** → **Hooks** and verify:
- Hook name: `custom_access_token_hook`
- Status: **Enabled** (green)

### Check 3: Check Supabase Logs
After attempting signup:
1. Go to **Logs** → **Postgres Logs**
2. Look for any error messages
3. Should NOT see "user_role does not exist" anymore

---

## 🎉 That's It!

**Just 2 steps:**
1. Run `database/COMPLETE_RBAC_SETUP.sql` in SQL Editor
2. Enable the hook in Authentication → Hooks

Your signup will work perfectly! 🚀
