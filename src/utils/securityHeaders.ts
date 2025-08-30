import { NextRequest, NextResponse } from 'next/server';

/**
 * Security headers middleware
 * Adds comprehensive security headers to all responses
 */
export function addSecurityHeaders(request: NextRequest, response: NextResponse): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: Unsafe-eval needed for Next.js dev
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' wss: https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  // Add security headers
  const headers = {
    // Content Security Policy
    'Content-Security-Policy': csp,
    
    // XSS Protection
    'X-XSS-Protection': '1; mode=block',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Clickjacking protection
    'X-Frame-Options': 'DENY',
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // HTTPS Strict Transport Security (only in production)
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),
    
    // Remove server information
    'Server': '',
    'X-Powered-By': '',
    
    // Permissions Policy (formerly Feature Policy)
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()'
    ].join(', ')
  };

  // Apply headers to response
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - strict limits
  '/api/session': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 per 15 minutes
  '/api/auth': { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 per 15 minutes
  
  // API endpoints - moderate limits  
  '/api/post': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
  '/api/credentials': { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute
  
  // Admin endpoints - very strict
  '/api/admin': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute
  
  // Default for other API routes
  '/api': { windowMs: 60 * 1000, maxRequests: 60 } // 60 per minute
};

/**
 * Simple in-memory rate limiter
 * In production, use Redis or a proper rate limiting service
 */
class SimpleRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  public isAllowed(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const key = identifier;
    const existing = this.requests.get(key);

    if (!existing || now > existing.resetTime) {
      // New window or expired window
      this.requests.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }

    if (existing.count >= config.maxRequests) {
      return false; // Rate limit exceeded
    }

    // Increment counter
    existing.count++;
    return true;
  }

  // Cleanup expired entries periodically
  public cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

export const rateLimiter = new SimpleRateLimiter();

// Cleanup expired rate limit entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}
