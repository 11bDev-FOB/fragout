import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { addSecurityHeaders, rateLimiter, RATE_LIMITS } from '@/utils/securityHeaders';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('🔴 CRITICAL: JWT_SECRET environment variable is required in production');
    }
    console.warn('⚠️  WARNING: Using fallback JWT_SECRET in middleware');
    return 'development_fallback_secret_change_me_in_production';
  })()
);

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add security headers to all responses
  const secureResponse = addSecurityHeaders(request, response);
  
  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Find matching rate limit config
    let rateLimitConfig = RATE_LIMITS['/api']; // Default
    for (const [path, config] of Object.entries(RATE_LIMITS)) {
      if (request.nextUrl.pathname.startsWith(path)) {
        rateLimitConfig = config;
        break;
      }
    }
    
    // Check rate limit
    const rateLimitKey = `${clientIP}:${request.nextUrl.pathname}`;
    if (!rateLimiter.isAllowed(rateLimitKey, rateLimitConfig)) {
      console.warn(`⚠️  Rate limit exceeded for ${clientIP} on ${request.nextUrl.pathname}`);
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(rateLimitConfig.windowMs / 1000).toString(),
          ...Object.fromEntries(secureResponse.headers.entries())
        }
      });
    }
  }

  const token = request.cookies.get('session')?.value;
  const rawCookie = request.headers.get('cookie');
  console.log('Middleware: session token:', token);
  console.log('Middleware: raw cookie header:', rawCookie);
  
  // Manual fallback parsing
  let manualToken = null;
  if (!token && rawCookie) {
    const match = rawCookie.match(/session=([^;]+)/);
    if (match) manualToken = match[1];
    console.log('Middleware: manualToken:', manualToken);
  }
  
  const sessionToken = token || manualToken;
  if (!sessionToken) {
    console.log('Middleware: No session token, redirecting to /auth');
    // Preserve query parameters when redirecting to auth
    const authUrl = new URL('/auth', request.url);
    authUrl.searchParams.set('returnUrl', request.nextUrl.pathname + request.nextUrl.search);
    const redirectResponse = NextResponse.redirect(authUrl);
    return addSecurityHeaders(request, redirectResponse);
  }
  
  try {
    await jwtVerify(sessionToken, JWT_SECRET);
    console.log('Middleware: Session token valid');
    return secureResponse;
  } catch (e) {
    console.log('Middleware: Invalid session token, redirecting to /auth');
    // Preserve query parameters when redirecting to auth
    const authUrl = new URL('/auth', request.url);
    authUrl.searchParams.set('returnUrl', request.nextUrl.pathname + request.nextUrl.search);
    const redirectResponse = NextResponse.redirect(authUrl);
    return addSecurityHeaders(request, redirectResponse);
  }
}

export const config = {
  matcher: [
    '/platform-setup',
    '/dashboard',
    '/compose',
    '/settings',
    '/admin',
    // Add more protected routes here
  ],
};
