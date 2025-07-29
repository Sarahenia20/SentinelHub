import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/signin(.*)',
  '/signup(.*)',
  '/reset-password(.*)',
  '/sso-callback(.*)',
  '/verify(.*)',
  '/terms',
  '/privacy',
  '/api/webhooks(.*)',
  '/api/health',
  '/api/auth(.*)', // For Clerk API routes
]);

// Define auth routes that should redirect authenticated users
const isAuthRoute = createRouteMatcher([
  '/signin',
  '/signup',
  '/reset-password',
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Block malicious requests
  if (
    pathname.includes('hybridaction') ||
    pathname.includes('zybTracker') ||
    pathname.includes('statistics')
  ) {
    return new Response('Blocked', { status: 403 });
  }

  // Always allow public routes
  if (isPublicRoute(req)) {
    // Special handling for SSO callback - always allow
    if (pathname.startsWith('/sso-callback')) {
      return NextResponse.next();
    }

    // For other public routes, check if user is authenticated and redirect away from auth pages
    const { userId } = await auth();

    if (userId && isAuthRoute(req)) {
      // Authenticated user trying to access auth pages - redirect to dashboard
      const dashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
  }

  // For protected routes, check authentication
  const { userId } = await auth();

  if (!userId) {
    // Not authenticated - redirect to signin
    const signInUrl = new URL('/signin', req.url);
    // Preserve the original URL for redirect after login
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // User is authenticated and accessing a protected route
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};