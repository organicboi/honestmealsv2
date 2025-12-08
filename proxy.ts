import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Define public routes that don't require authentication
const publicRoutes = ['/', '/sign-in', '/sign-up', '/forgot-password', '/auth/callback'];

// Define role-based route prefixes for future use
const roleBasedRoutes = {
  admin: '/admin',
  trainer: '/trainer',
  gym_franchise: '/gym',
  influencer: '/influencer',
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth/'));

  // If it's a public route, allow access
  if (isPublicRoute) {
    return supabaseResponse;
  }

  // If no user and trying to access protected route, redirect to sign-in
  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/sign-in';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based access control
  // Fetch user role from database
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  const userRole = profile?.role;
  
  // Check if accessing a role-specific route
  for (const [role, routePrefix] of Object.entries(roleBasedRoutes)) {
    if (pathname.startsWith(routePrefix)) {
      if (userRole !== role) {
        // User doesn't have required role, redirect to unauthorized page
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/unauthorized';
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - API routes (handled separately if needed)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)',
  ],
};
