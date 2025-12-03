# 🚀 Quick Start - RBAC Setup Checklist

## ✅ Setup Steps (Do these first!)

### 1️⃣ Run Complete Setup File
```sql
-- Copy and paste EVERYTHING from this file in Supabase SQL Editor:
-- File: database/COMPLETE_RBAC_SETUP.sql
```
✓ Removes old enum-based role system  
✓ Creates roles and user_roles tables  
✓ Inserts default roles  
✓ Creates helper functions  
✓ Sets up automatic role assignment trigger  
✓ Creates JWT token hook function  
✓ Migrates existing users  

### 2️⃣ Enable Hook in Supabase Dashboard
```
Supabase Dashboard → Authentication → Hooks
→ Create New Hook
→ Type: Custom Access Token
→ Function: custom_access_token_hook
→ Enable ✓
```

### 3️⃣ Verify Setup
```sql
-- Run in Supabase SQL Editor
SELECT * FROM public.roles;
-- Should show: standard_user, admin, moderator, trainer, influencer
```

---

## 📁 Files Overview

### Main Setup File (USE THIS!)
```
database/
  └── COMPLETE_RBAC_SETUP.sql          ⭐ RUN THIS FILE!
```

### Created Files (for reference)
```
database/migrations/
  ├── 000_cleanup_legacy_roles.sql     (Not needed - included in complete file)
  ├── 001_setup_roles.sql              (Not needed - included in complete file)
  └── 002_custom_access_token_hook.sql (Not needed - included in complete file)

lib/auth/
  └── roleQueries.ts               (NEW - Database queries for roles)

docs/
  └── SIGNUP_RBAC_INTEGRATION.md   (Full setup guide)

scripts/
  └── setup-rbac.ps1               (Setup helper script)

SIGNUP_UPDATE_SUMMARY.md            (This summary)
```

### Modified Files
```
app/actions/auth.ts                 (Simplified - trigger handles roles)
lib/auth/roles.ts                   (Updated for multi-role support)
```

---

## 🔑 Key Changes

### Before
```typescript
// Single role, stored in profiles table
user.role = 'user'
```

### After
```typescript
// Multiple roles, stored in roles + user_roles tables
user.app_metadata.roles = ['standard_user']

// Can have multiple roles:
user.app_metadata.roles = ['standard_user', 'trainer', 'moderator']
```

---

## 💡 Common Use Cases

### Check if User is Admin
```typescript
import { isAdmin } from '@/lib/auth/roles';

const { data: { user } } = await supabase.auth.getUser();
if (isAdmin(user)) {
  // Show admin features
}
```

### Get User Roles from Database
```typescript
import { getUserRoles } from '@/lib/auth/roleQueries';

const roles = await getUserRoles(userId);
// Returns: ['standard_user', 'trainer']
```

### Assign Role (Admin Only)
```typescript
import { assignRoleToUser } from '@/lib/auth/roleQueries';

await assignRoleToUser(userId, 'admin');
// User must re-login to see new role in JWT
```

### Check Role in RLS Policy
```sql
CREATE POLICY "Admins can view all"
ON public.orders
FOR SELECT
USING (
  auth.uid() = customer_id 
  OR public.jwt_has_role('admin')
);
```

---

## 🎯 What Happens During Signup

```mermaid
User Signs Up
    ↓
Supabase Auth creates user
    ↓
Database trigger fires automatically
    ↓
├─ Assigns 'standard_user' role (user_roles table)
└─ Creates profile (profiles table)
    ↓
User is ready!
```

---

## 🔍 Testing Your Setup

### Test 1: Sign Up New User
```bash
# Sign up through your app
# Then check in Supabase SQL Editor:
```
```sql
SELECT 
  u.email,
  r.name as role
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE u.email = 'test@example.com';
```

### Test 2: Check JWT Token
```javascript
// After login, in browser console:
const { data: { session } } = await supabase.auth.getSession();
console.log(session?.user?.app_metadata?.roles);
// Expected: ['standard_user']
```

### Test 3: Verify Trigger Works
```sql
-- Check trigger exists
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Role not in JWT | Re-login (JWT updates on login) |
| Trigger not firing | Check trigger exists in pg_trigger |
| Permission denied | Run both migrations, check RLS policies |
| Hook not working | Enable in Dashboard → Auth → Hooks |

---

## 📚 Resources

- **Full Documentation**: `docs/SIGNUP_RBAC_INTEGRATION.md`
- **RBAC Architecture**: `docs/roles/rolesImplementation.md`
- **Supabase Auth Hooks**: https://supabase.com/docs/guides/auth/auth-hooks

---

## 🎉 You're Done!

Once you've completed the 4 setup steps above, your signup process will:
- ✅ Automatically assign 'standard_user' role to new users
- ✅ Create profile entries with onboarding tracking
- ✅ Inject roles into JWT tokens for fast authorization
- ✅ Support multiple roles per user
- ✅ Work with RLS policies for database security

**Need help?** Check `SIGNUP_UPDATE_SUMMARY.md` or `docs/SIGNUP_RBAC_INTEGRATION.md`
