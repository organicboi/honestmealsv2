import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { createClient } from '@/utils/supabase/server';

// Define public routes that don't require authentication
const publicRoutes = ['/', '/sign-in', '/sign-up', '/forgot-password', '/auth/callback'];

// Define role-based route prefixes for future use
const roleBasedRoutes = {
  admin: '/admin',
  trainer: '/trainer',
  gym_franchise: '/gym',
  influencer: '/influencer',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update the session (refresh token if needed)
  const response = await updateSession(request);

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth/'));

  // If it's a public route, allow access
  if (isPublicRoute) {
    return response;
  }

  // For protected routes, check authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  return response;
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
