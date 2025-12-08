# Admin Dashboard & RBAC System Guide

## Overview
This document outlines the implementation of the Admin Dashboard and the Role-Based Access Control (RBAC) system for Honest Meals. The system allows authorized administrators to manage the platform's content (starting with Meals) while ensuring unauthorized users are blocked at multiple security layers.

## 1. Role-Based Access Control (RBAC) Architecture

The security system is built on a **Defense-in-Depth** strategy, verifying permissions at three distinct layers.

### Layer 1: Middleware (The Gatekeeper)
*   **File:** `middleware.ts`
*   **Function:** Intercepts every request before it reaches the application code.
*   **Logic:**
    1.  Checks if the requested route starts with `/admin`.
    2.  Fetches the user's profile from Supabase.
    3.  Verifies if `profile.role === 'admin'`.
    4.  Redirects to `/unauthorized` if the check fails.

### Layer 2: Layout Protection (UI Security)
*   **File:** `app/admin/layout.tsx`
*   **Function:** Prevents the Admin UI shell (sidebar, navigation) from rendering for non-admins.
*   **Logic:** Performs a server-side check of the user's role. If invalid, it redirects immediately, ensuring no admin interface elements are ever sent to the client.

### Layer 3: Server Actions (Data Security)
*   **File:** `app/actions/admin/meals.ts`
*   **Function:** Secures the database operations (`INSERT`, `UPDATE`, `DELETE`).
*   **Logic:** Even if a user bypasses the UI, they cannot execute these functions. Every action verifies the user's role before connecting to the database.

## 2. Database Schema Requirements

To support this system, the `profiles` table requires a specific column structure.

**Required SQL Setup:**
```sql
-- 1. Add role column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'standard_user';

-- 2. Add safety constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('standard_user', 'admin', 'trainer', 'influencer', 'gym_franchise'));
```

**How to Make a User an Admin:**
Run this SQL query in your Supabase SQL Editor:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'target_user@example.com';
```

## 3. Project Structure

### Admin Routes (`app/admin/`)
*   `layout.tsx`: The main shell with the sidebar navigation.
*   `page.tsx`: The dashboard overview (Stats & Quick Actions).
*   `meals/page.tsx`: List view of all meals with Edit/Delete options.
*   `addmeal/page.tsx`: Form page to create new meals.
*   `meals/[id]/edit/page.tsx`: Form page to edit existing meals.

### Server Actions (`app/actions/admin/`)
*   `meals.ts`: Contains `getMeals`, `createMeal`, `updateMeal`, and `deleteMeal`.

### Components (`components/admin/`)
*   `MealForm.tsx`: A reusable form component used by both "Add" and "Edit" pages. Handles image URLs, nutritional info, and toggles.
*   `MealsTable.tsx`: A responsive table component to display meal data with action buttons.

## 4. How to Extend the System

To add a new section (e.g., **Order Management**), follow this pattern:

1.  **Create the Route:**
    *   Create `app/admin/orders/page.tsx`.
    *   The `layout.tsx` will automatically wrap it with the sidebar and security checks.

2.  **Create the Server Actions:**
    *   Create `app/actions/admin/orders.ts`.
    *   **Crucial:** Copy the security check logic from `meals.ts` to the top of every function.

    ```typescript
    // Example Security Check
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Unauthorized' };
    ```

3.  **Add to Sidebar:**
    *   Open `app/admin/layout.tsx`.
    *   Add a new `<Link>` to the navigation section.

## 5. Troubleshooting

*   **"I keep getting redirected to /unauthorized":**
    *   Check your database: Does your user row in `profiles` have `role` set to `'admin'`?
    *   Did you run the SQL migration script?

*   **"I can't see the new page I added":**
    *   Ensure the file is named `page.tsx` inside the correct folder structure.
    *   Restart the dev server if you added new folders.
