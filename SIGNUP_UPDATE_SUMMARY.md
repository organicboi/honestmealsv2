# Signup Process Update - Summary of Changes

## 🎯 What Was Done

Your signup process has been updated to integrate with the new RBAC (Role-Based Access Control) system described in `docs/roles/rolesImplementation.md`.

## 📝 Files Created

### 1. Database Migrations
- **`database/migrations/001_setup_roles.sql`**
  - Creates default roles (standard_user, admin, moderator, trainer, influencer)
  - Creates `jwt_has_role()` function for RLS policies
  - Creates `get_user_roles()` function
  - Creates `handle_new_user()` trigger that automatically assigns roles and creates profiles
  - Sets up RLS policies on `user_roles` table

- **`database/migrations/002_custom_access_token_hook.sql`**
  - Creates the Custom Access Token Hook function
  - Injects user roles into JWT `app_metadata.roles`
  - Grants permissions to Supabase Auth

### 2. Application Code
- **`lib/auth/roleQueries.ts`** (NEW)
  - Database query functions for role management
  - Server and client functions to fetch, assign, and remove roles
  - Admin functions to manage roles

### 3. Documentation
- **`docs/SIGNUP_RBAC_INTEGRATION.md`**
  - Complete setup guide
  - Usage examples
  - Troubleshooting tips
  - Security notes

### 4. Setup Script
- **`scripts/setup-rbac.ps1`**
  - PowerShell script with setup instructions
  - Quick reference for migration files
  - Helpful commands for verification

## 🔄 Files Modified

### 1. `app/actions/auth.ts`
**Before:**
```typescript
export async function signup(formData: FormData) {
  const supabase = await createClient();
  const data = { email: ..., password: ... };
  const { error } = await supabase.auth.signUp(data);
  if (error) return { error: error.message };
  redirect('/');
}
```

**After:**
```typescript
export async function signup(formData: FormData) {
  const supabase = await createClient();
  const data = { email: ..., password: ... };
  
  // The database trigger will automatically:
  // 1. Assign the 'standard_user' role
  // 2. Create a profile entry
  const { data: authData, error: signUpError } = await supabase.auth.signUp(data);
  
  if (signUpError) return { error: signUpError.message };
  if (!authData.user) return { error: 'Failed to create user account' };
  
  redirect('/');
}
```

### 2. `lib/auth/roles.ts`
**Updated:**
- Changed `UserRole` type from `'user' | 'admin' | ...` to `'standard_user' | 'admin' | 'moderator' | 'trainer' | 'influencer'`
- Changed from single role to multi-role support
- Added `getUserRoles()` to extract roles from JWT `app_metadata`
- Updated `hasRole()`, `hasAnyRole()` to work with role arrays
- Added `isAdmin()` and `isModerator()` helper functions
- Updated `getAllowedRoutes()` to combine routes from all user roles
- Fixed `canAccessRoute()` to use new helper functions

## 🚀 How the New System Works

### Signup Flow
```
User signs up
    ↓
Supabase Auth creates user in auth.users
    ↓
Database trigger fires (handle_new_user)
    ↓
Trigger assigns 'standard_user' role to user_roles table
    ↓
Trigger creates profile entry with onboarding tracking
    ↓
User is redirected to home page
```

### Login Flow
```
User logs in
    ↓
Custom Access Token Hook runs
    ↓
Hook queries user_roles and roles tables
    ↓
Hook injects roles into JWT: app_metadata.roles = ['standard_user']
    ↓
JWT returned to client with roles embedded
```

### Authorization Check
```typescript
// Client/Server Component
const { data: { user } } = await supabase.auth.getUser();
const userRoles = getUserRoles(user);

if (userRoles.includes('admin')) {
  // Show admin features
}

// Or use helper functions
if (isAdmin(user)) {
  // Show admin panel
}
```

### RLS Policy (Database Level)
```sql
CREATE POLICY "Users can view own data"
  ON public.orders
  FOR SELECT
  USING (
    auth.uid() = customer_id 
    OR public.jwt_has_role('admin')
  );
```

## ✅ Next Steps

### 1. Run Database Migrations (REQUIRED)
```bash
# Option A: Run setup script
./scripts/setup-rbac.ps1

# Option B: Manual setup
# 1. Open Supabase Dashboard → SQL Editor
# 2. Copy and run database/migrations/001_setup_roles.sql
# 3. Copy and run database/migrations/002_custom_access_token_hook.sql
```

### 2. Enable Custom Access Token Hook (REQUIRED)
1. Go to: Supabase Dashboard → Authentication → Hooks
2. Create new hook: Type = "Custom Access Token"
3. Select function: `custom_access_token_hook`
4. Enable the hook

### 3. Verify Setup
```sql
-- Check roles were created
SELECT * FROM public.roles ORDER BY name;

-- Test signup and verify role assignment
SELECT 
  u.email,
  r.name as role_name
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE u.email = 'test@example.com';
```

### 4. Test JWT Token
```javascript
// After login, in browser console
const { data: { session } } = await supabase.auth.getSession();
console.log(session?.user?.app_metadata?.roles);
// Expected output: ['standard_user']
```

## 📚 Usage Examples

### Check User Role in Component
```typescript
import { isAdmin, hasRole } from '@/lib/auth/roles';
import { getUserRoles } from '@/lib/auth/roleQueries';

export default async function MyComponent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Quick check using JWT claims
  if (isAdmin(user)) {
    return <AdminPanel />;
  }
  
  // Detailed check from database
  const roles = await getUserRoles(user?.id || '');
  if (roles.includes('moderator')) {
    return <ModeratorTools />;
  }
  
  return <StandardUserView />;
}
```

### Assign Role to User (Admin Action)
```typescript
'use server';
import { assignRoleToUser } from '@/lib/auth/roleQueries';

export async function promoteToAdmin(userId: string) {
  const result = await assignRoleToUser(userId, 'admin');
  if (!result.success) {
    throw new Error(result.error);
  }
  // User must log out and back in to get updated JWT
  return { success: true };
}
```

### Protect Routes with Middleware
```typescript
// middleware.ts
import { createServerClient } from '@/utils/supabase/middleware';
import { hasRole } from '@/lib/auth/roles';

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!hasRole(user, 'admin')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  return NextResponse.next();
}
```

## 🔐 Security Notes

1. **Never trust client-side role checks alone** - Always verify on server
2. **Use RLS policies** for database-level security
3. **JWT roles update on login** - Users must re-login to see role changes
4. **Admin operations** should always verify admin status server-side

## 📖 Additional Resources

- **Full RBAC Documentation**: `docs/roles/rolesImplementation.md`
- **Setup Guide**: `docs/SIGNUP_RBAC_INTEGRATION.md`
- **Supabase Auth Hooks**: https://supabase.com/docs/guides/auth/auth-hooks
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security

## 🐛 Troubleshooting

### Role not appearing in JWT
- Verify Custom Access Token Hook is enabled in Supabase Dashboard
- Check user has role in `user_roles` table
- User must log out and back in to refresh token

### Trigger not firing
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check Supabase logs for errors
```

### Permission errors
- Verify you ran both migration files
- Check Supabase logs for RLS policy violations
- Test `jwt_has_role()` function manually

---

**Questions or issues?** Check the documentation files or review the RBAC implementation guide.
