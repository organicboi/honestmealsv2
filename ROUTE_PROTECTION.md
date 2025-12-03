# Route Protection & Role-Based Access Control

## 🛡️ Implementation Strategy

This project uses **Middleware-based route protection** - the most efficient and scalable approach for Next.js 14+ App Router.

### Why Middleware?

✅ **Server-side protection** - Checks happen before page renders
✅ **No flash of wrong content** - Users never see pages they can't access
✅ **Centralized logic** - All auth in one place
✅ **Automatic API protection** - Middleware covers all routes
✅ **Performance** - Redirects happen at edge, before React loads
✅ **Scalable** - Easy to add role-based access control

## 📂 Current Setup

### Public Routes (No Auth Required)
- `/` - Homepage
- `/sign-in` - Login page
- `/sign-up` - Registration page
- `/forgot-password` - Password reset
- `/auth/*` - Auth callbacks

### Protected Routes (Auth Required)
- `/meals` - Browse meals (NEW)
- `/profile` - User profile
- `/cart` - Shopping cart (future)
- `/orders` - Order history (future)
- All other routes

### How It Works

```typescript
// middleware.ts checks every request

1. User visits /meals
   ↓
2. Middleware intercepts request
   ↓
3. Checks if route is public → NO
   ↓
4. Checks if user authenticated → YES/NO
   ↓
5a. YES → Allow access to /meals
5b. NO → Redirect to /sign-in?redirectTo=/meals
```

## 🔮 Future: Role-Based Access Control

The system is ready for roles. Here's how to implement it:

### 1. Add Roles to User Metadata in Supabase

```sql
-- In Supabase SQL Editor
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@honestmeals.com';
```

### 2. Uncomment Role Logic in Middleware

```typescript
// middleware.ts (lines 38-51)
const userRole = user.user_metadata?.role;

for (const [role, routePrefix] of Object.entries(roleBasedRoutes)) {
  if (pathname.startsWith(routePrefix)) {
    if (userRole !== role) {
      // Redirect to unauthorized page
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/unauthorized';
      return NextResponse.redirect(redirectUrl);
    }
  }
}
```

### 3. Create Role-Specific Pages

```bash
# Example structure
app/
├── admin/
│   ├── page.tsx              # Admin dashboard
│   ├── users/page.tsx        # User management
│   └── meals/page.tsx        # Meal management
├── trainer/
│   ├── page.tsx              # Trainer dashboard
│   └── clients/page.tsx      # Client management
├── gym/
│   ├── page.tsx              # Gym dashboard
│   └── members/page.tsx      # Member management
└── influencer/
    ├── page.tsx              # Influencer dashboard
    └── campaigns/page.tsx    # Campaign management
```

## 🎯 Available Roles

Configured in `lib/auth/roles.ts`:

```typescript
- user         → /meals, /cart, /orders, /profile
- admin        → /admin/* (+ all user routes)
- trainer      → /trainer/*
- gymFranchise → /gym/*
- influencer   → /influencer/*
```

## 🔧 Utility Functions

### Check User Role
```typescript
import { hasRole } from '@/lib/auth/roles';

// In a Server Component
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (hasRole(user, 'admin')) {
  // Show admin content
}
```

### Check Multiple Roles
```typescript
import { hasAnyRole } from '@/lib/auth/roles';

if (hasAnyRole(user, ['admin', 'trainer'])) {
  // Show content for admins and trainers
}
```

### Check Route Access
```typescript
import { canAccessRoute } from '@/lib/auth/roles';

if (canAccessRoute(user, '/admin/users')) {
  // User can access this route
}
```

## 📝 Adding New Protected Routes

### Method 1: Automatic Protection (Recommended)
Any route NOT in `publicRoutes` array is automatically protected:

```typescript
// Just create the page - it's protected by default!
app/
└── new-feature/
    └── page.tsx  // ✅ Automatically protected
```

### Method 2: Add to Public Routes
```typescript
// middleware.ts
const publicRoutes = [
  '/', 
  '/sign-in', 
  '/sign-up',
  '/your-public-route',  // Add here
];
```

## 🎨 Example: Adding Admin Dashboard

### 1. Create Admin Page
```typescript
// app/admin/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Extra check (middleware already protects this)
  if (user?.user_metadata?.role !== 'admin') {
    redirect('/unauthorized');
  }
  
  return <AdminDashboard user={user} />;
}
```

### 2. Update Middleware (Uncomment Role Logic)
```typescript
// middleware.ts
// Uncomment lines 38-51
```

### 3. Set User Role in Supabase
```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your-email@example.com';
```

## 🚀 Migration Guide for Roles

When you're ready to implement roles:

### Step 1: Database Setup
```sql
-- Add role column to profiles table (if you have one)
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';

-- Or use Supabase user metadata (simpler)
-- Update via Supabase Dashboard or SQL
```

### Step 2: Update Middleware
```typescript
// Uncomment role-based logic in middleware.ts
```

### Step 3: Create Role Pages
```bash
mkdir -p app/admin app/trainer app/gym app/influencer
```

### Step 4: Update Navigation
```typescript
// Show different nav items based on role
{user.role === 'admin' && <Link href="/admin">Admin Panel</Link>}
{user.role === 'trainer' && <Link href="/trainer">Trainer Dashboard</Link>}
```

## 🔒 Security Best Practices

✅ **Never trust client-side checks alone** - Always validate on server
✅ **Use middleware for route protection** - Blocks access before page loads
✅ **Double-check in Server Components** - Extra layer of security
✅ **Store roles in user_metadata** - Part of Supabase JWT
✅ **Use TypeScript** - Type-safe role checks
✅ **Log access attempts** - Monitor unauthorized access

## 📊 Current vs Future

### Current Setup (Simple Auth)
```typescript
if (!user) {
  redirect('/sign-in');  // Just check if logged in
}
```

### Future Setup (Role-Based)
```typescript
if (!user || user.role !== 'admin') {
  redirect('/unauthorized');  // Check role too
}
```

## 🎯 Quick Reference

| Need | Solution |
|------|----------|
| Protect single route | Don't add to `publicRoutes` |
| Make route public | Add to `publicRoutes` array |
| Add role-based route | Create route + uncomment middleware logic |
| Check role in component | Use `hasRole()` utility |
| Set user role | Update user_metadata in Supabase |

## 🐛 Troubleshooting

**Q: Getting redirected when I should have access**
- Check middleware `publicRoutes` array
- Verify user is authenticated
- Check user role in Supabase Dashboard

**Q: Can access page I shouldn't**
- Ensure middleware is running (`middleware.ts` exists)
- Check middleware matcher pattern
- Verify role-based logic is uncommented

**Q: Redirect loop**
- Make sure `/sign-in` is in `publicRoutes`
- Check if middleware is creating circular redirects

## 📚 Resources

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Role-Based Access Control Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)

---

**Your route protection is production-ready and scales to multi-role systems! 🚀**
