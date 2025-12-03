# Updated Signup Process - RBAC Integration

## Overview
The signup process has been updated to integrate with our new table-based RBAC (Role-Based Access Control) system. This document explains the changes and setup required.

## Changes Made

### 1. Updated Signup Action (`app/actions/auth.ts`)
The signup function now:
- Creates the user account via Supabase Auth
- Automatically assigns the `standard_user` role
- Creates a profile entry with onboarding tracking
- Handles errors gracefully (user account is still created even if role assignment fails)

### 2. Database Migrations
Created two migration files in `database/migrations/`:

#### `001_setup_roles.sql`
- Inserts default roles (standard_user, admin, moderator, trainer, influencer)
- Creates `jwt_has_role()` helper function for RLS policies
- Creates `get_user_roles()` function to retrieve user roles
- Creates `handle_new_user()` trigger function
- Sets up automatic role assignment when new users sign up
- Enables RLS on `user_roles` table with appropriate policies

#### `002_custom_access_token_hook.sql`
- Defines the Custom Access Token Hook function
- Injects user roles into JWT `app_metadata.roles`
- Grants necessary permissions to Supabase Auth

### 3. Role Management Utilities

#### `lib/auth/roles.ts`
Updated type-safe role utilities:
- `UserRole` type: 'standard_user' | 'admin' | 'moderator' | 'trainer' | 'influencer'
- `getUserRoles()`: Extracts roles from JWT claims
- `hasRole()`: Check if user has a specific role
- `hasAnyRole()`: Check if user has any of specified roles
- `isAdmin()`: Quick admin check
- `isModerator()`: Check for moderator or admin
- `getAllowedRoutes()`: Get all routes user can access
- `canAccessRoute()`: Check if user can access a specific route

#### `lib/auth/roleQueries.ts` (NEW)
Database query functions:
- `getUserRoles()`: Fetch user roles from database (server)
- `getUserRolesClient()`: Fetch user roles (client)
- `assignRoleToUser()`: Assign role to user (admin only)
- `removeRoleFromUser()`: Remove role from user (admin only)
- `getAllRoles()`: Get all available roles
- `userHasRole()`: Check if user has specific role
- `isUserAdmin()`: Check if user is admin
- `createRole()`: Create new role (admin only)

## Setup Instructions

### Step 1: Run Database Migrations

Run both migration files in your Supabase SQL Editor:

1. Navigate to Supabase Dashboard → SQL Editor
2. Copy and paste `database/migrations/001_setup_roles.sql`
3. Execute
4. Copy and paste `database/migrations/002_custom_access_token_hook.sql`
5. Execute

### Step 2: Set Up Custom Access Token Hook

1. Go to: Supabase Dashboard → Authentication → Hooks
2. Click "Create a new hook"
3. Select hook type: **Custom Access Token**
4. Select function: `custom_access_token_hook`
5. Enable the hook

### Step 3: Verify Setup

Test the signup flow:

```bash
# Sign up a new user through your app
# Check the database to verify:
```

In Supabase SQL Editor:
```sql
-- Check if user was created with role
SELECT 
  u.email,
  r.name as role_name
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE u.email = 'test@example.com';

-- Check if profile was created
SELECT * FROM public.profiles 
WHERE email = 'test@example.com';
```

### Step 4: Test JWT Token

After login, verify the JWT contains roles:

```javascript
// In browser console or your app
const { data: { session } } = await supabase.auth.getSession();
console.log(session?.user?.app_metadata?.roles);
// Should output: ['standard_user']
```

## How It Works

### Signup Flow

1. **User submits signup form** → `app/sign-up/page.tsx`
2. **Signup action called** → `app/actions/auth.ts`
3. **Supabase creates user** → `auth.users` table
4. **Trigger fires** → `handle_new_user()` function
5. **Role assigned** → `user_roles` table gets entry
6. **Profile created** → `profiles` table gets entry
7. **User redirected** → Home page

### Login Flow with JWT

1. **User logs in** → Supabase Auth
2. **Token hook runs** → `custom_access_token_hook()`
3. **Roles fetched** → From `user_roles` + `roles` tables
4. **JWT enriched** → `app_metadata.roles` added
5. **Token returned** → Contains roles array

### Authorization Check

```typescript
import { hasRole, isAdmin } from '@/lib/auth/roles';

// In a server component
const user = await supabase.auth.getUser();
if (isAdmin(user.data.user)) {
  // Show admin features
}

// In RLS policy (SQL)
CREATE POLICY "Admins can view all"
  ON public.orders
  FOR SELECT
  USING (
    auth.uid() = customer_id 
    OR public.jwt_has_role('admin')
  );
```

## Usage Examples

### Assign Role to User (Admin Action)

```typescript
'use server';
import { assignRoleToUser } from '@/lib/auth/roleQueries';

export async function makeUserAdmin(userId: string) {
  const result = await assignRoleToUser(userId, 'admin');
  if (!result.success) {
    throw new Error(result.error);
  }
  return { success: true };
}
```

### Check User Role in Component

```typescript
import { getUserRoles } from '@/lib/auth/roleQueries';

export default async function AdminPanel() {
  const user = await supabase.auth.getUser();
  const roles = await getUserRoles(user.data.user?.id || '');
  
  if (!roles.includes('admin')) {
    return <div>Access Denied</div>;
  }
  
  return <div>Admin Panel</div>;
}
```

### Protect Route with Middleware

Update your middleware to check roles:

```typescript
import { hasRole } from '@/lib/auth/roles';

// In middleware.ts
const user = await supabase.auth.getUser();
const isAdmin = hasRole(user.data.user, 'admin');

if (request.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
  return NextResponse.redirect('/unauthorized');
}
```

## Future Enhancements

### Adding New Roles

Simply insert into the `roles` table:

```sql
INSERT INTO public.roles (name) 
VALUES ('nutritionist')
ON CONFLICT (name) DO NOTHING;
```

### Adding Permissions (Future)

Create a `role_permissions` table:

```sql
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id integer REFERENCES public.roles(id),
  resource text NOT NULL,
  permission text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

## Troubleshooting

### Role not appearing in JWT
- Verify Custom Access Token Hook is enabled
- Check user has role in `user_roles` table
- User must log out and log back in to refresh token

### Trigger not firing
- Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Verify function has correct permissions
- Check Supabase logs for errors

### RLS policies blocking access
- Test `jwt_has_role()` function manually
- Verify JWT structure with `SELECT auth.jwt();`
- Check policy conditions match your use case

## Security Notes

- **Never trust client-side role checks** - Always verify on server
- **Use RLS policies** for database-level security
- **JWT claims are tamper-proof** but not encrypted - don't store sensitive data
- **Roles in JWT update on login** - for real-time changes, query database

## References

- [RBAC Documentation](../../docs/roles/rolesImplementation.md)
- [Supabase Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
