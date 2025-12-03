# Honest Meals - Authentication Setup

## Overview

This project uses **Supabase Authentication** with **Next.js 14+ App Router** and server-side rendering (SSR) for optimal performance and security.

## 🏗️ Architecture

### Folder Structure

```
app/
├── actions/
│   └── auth.ts              # Server actions for authentication
├── auth/
│   └── callback/
│       └── route.ts         # OAuth callback handler
├── sign-in/
│   └── page.tsx             # Sign in page (client component)
├── sign-up/
│   └── page.tsx             # Sign up page (client component)
├── forgot-password/
│   └── page.tsx             # Password reset page (client component)
├── profile/
│   ├── page.tsx             # Profile page (server component)
│   └── ProfileClient.tsx    # Profile UI (client component)
├── page.tsx                 # Homepage (server component)
└── HomePageClient.tsx       # Homepage UI (client component)

utils/
└── supabase/
    ├── client.ts            # Client-side Supabase client
    ├── server.ts            # Server-side Supabase client
    └── middleware.ts        # Session management middleware

middleware.ts                # Root middleware for auth session refresh
```

## 🔐 Authentication Features

### Implemented Features

- ✅ **Email/Password Authentication**
  - Sign up with email verification
  - Sign in with password
  - Password reset via email
  
- ✅ **OAuth Integration** (Ready for Google)
  - Google Sign-In (requires Supabase configuration)
  - Extensible for other providers

- ✅ **Session Management**
  - Automatic session refresh via middleware
  - Server-side session validation
  - Secure cookie-based authentication

- ✅ **Protected Routes**
  - Server-side authentication checks
  - Automatic redirects for unauthenticated users

- ✅ **User Profile**
  - View account information
  - Email verification status
  - Sign out functionality

## 🚀 Setup Instructions

### 1. Supabase Configuration

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project credentials from Settings → API
3. Enable Email authentication in Authentication → Providers

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Email Templates (Optional)

Customize email templates in Supabase Dashboard:
- Authentication → Email Templates
- Modify confirmation, password reset, and magic link emails

### 4. OAuth Setup (Optional)

For Google OAuth:
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add OAuth credentials from Google Cloud Console
4. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`

## 📝 Usage

### Server Actions

All authentication operations use Next.js Server Actions for security:

```typescript
// app/actions/auth.ts

export async function login(formData: FormData) {
  'use server';
  // Email/password sign in
}

export async function signup(formData: FormData) {
  'use server';
  // User registration
}

export async function signout() {
  'use server';
  // Sign out and redirect
}

export async function resetPassword(formData: FormData) {
  'use server';
  // Send password reset email
}
```

### Server Components (SSR)

Pages that need user data use server-side rendering:

```typescript
// app/page.tsx
export default async function HomePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    return <HomePageClient user={user} />;
}
```

### Client Components

Interactive UI components receive user data as props:

```typescript
// app/HomePageClient.tsx
'use client';

interface HomePageClientProps {
    user: any;
}

export default function HomePageClient({ user }: HomePageClientProps) {
    // Client-side interactivity with user data
}
```

## 🛡️ Security Features

### Server-Side Authentication
- User data fetched on server before rendering
- No exposure of authentication state to client until verified
- Secure session management via HTTP-only cookies

### Middleware Protection
- Automatic session refresh on every request
- Maintains authentication state across page navigations
- Handles token expiration gracefully

### Protected Routes
- Server-side checks before rendering
- Automatic redirects to sign-in page
- No flash of unauthenticated content

## 🎨 UI Components

All authentication pages feature:
- Responsive design (mobile-first)
- Framer Motion animations
- Loading states
- Error handling with user-friendly messages
- Success confirmations
- Consistent branding with Honest Meals theme

## 🔄 User Flow

### Sign Up Flow
1. User fills sign-up form
2. Server action creates account
3. Email verification sent (if enabled)
4. User redirected to homepage
5. Email confirmation required for full access

### Sign In Flow
1. User enters credentials
2. Server action validates and creates session
3. Session cookie set automatically
4. User redirected to homepage
5. Middleware maintains session

### Password Reset Flow
1. User requests password reset
2. Email sent with reset link
3. User clicks link in email
4. Redirected to password update page
5. New password saved

## 📦 Dependencies

```json
{
  "@supabase/supabase-js": "latest",
  "@supabase/ssr": "latest",
  "framer-motion": "latest",
  "lucide-react": "latest"
}
```

## 🧪 Testing Authentication

### Local Testing
1. Start development server: `npm run dev`
2. Navigate to `/sign-up`
3. Create a test account
4. Check Supabase Dashboard → Authentication → Users
5. Test sign-in, profile, and sign-out

### Email Configuration
- Development: Check Supabase logs for confirmation links
- Production: Configure SMTP settings in Supabase

## 🚨 Common Issues

### Issue: "Invalid login credentials"
- **Solution**: Ensure email is confirmed or disable email confirmation in Supabase settings

### Issue: Session not persisting
- **Solution**: Check middleware.ts is running and cookies are enabled

### Issue: OAuth redirect errors
- **Solution**: Verify redirect URLs in OAuth provider settings and Supabase configuration

### Issue: CORS errors
- **Solution**: Ensure NEXT_PUBLIC_SITE_URL matches your domain

## 🔮 Future Enhancements

- [ ] Social OAuth (GitHub, Facebook, Twitter)
- [ ] Two-factor authentication (2FA)
- [ ] Magic link authentication
- [ ] Profile editing and user settings
- [ ] Account deletion
- [ ] Session management (view active sessions)

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side-rendering)

## 🤝 Support

For issues or questions:
- Check Supabase Dashboard logs
- Review Next.js error messages
- Contact: support@honestmeals.com
