import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'replace_with_a_secure_secret';

export function middleware(request: NextRequest) {
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
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  try {
    jwt.verify(sessionToken, JWT_SECRET);
    console.log('Middleware: Session token valid');
    return NextResponse.next();
  } catch (e) {
    console.log('Middleware: Invalid session token, redirecting to /auth');
    return NextResponse.redirect(new URL('/auth', request.url));
  }
}

export const config = {
  matcher: [
    '/platform-setup',
    '/api/credentials',
    // Add more protected routes here
  ],
};
