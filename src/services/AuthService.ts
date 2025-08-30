import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import DatabaseService from './DatabaseService';

export interface SessionPayload {
  pubkey: string;
  exp: number;
}

class AuthService {
  private static readonly JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('🔴 CRITICAL: JWT_SECRET environment variable is required in production');
      }
      console.warn('⚠️  WARNING: Using fallback JWT_SECRET in development - set JWT_SECRET in .env.local');
      return 'development_fallback_secret_change_me_in_production';
    })()
  );
  private static readonly COOKIE_NAME = 'session';
  private static readonly TOKEN_EXPIRY = '7d'; // 7 days

  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  public async createSession(pubkey: string): Promise<string> {
    try {
      // Create JWT token
      const token = await new SignJWT({ pubkey })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(AuthService.TOKEN_EXPIRY)
        .sign(AuthService.JWT_SECRET);

      // Store session in database
      this.db.createSession(pubkey);

      console.log('API/session: Created session for pubkey:', pubkey);
      return token;
    } catch (error) {
      console.error('Session creation error:', error);
      throw new Error('Failed to create session');
    }
  }

  public async setSessionCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(AuthService.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
  }

  public async getSessionFromCookie(): Promise<SessionPayload | null> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(AuthService.COOKIE_NAME)?.value;
      
      if (!token) return null;

      const { payload } = await jwtVerify(token, AuthService.JWT_SECRET);
      
      // Validate payload has required properties
      if (payload && typeof payload.pubkey === 'string' && typeof payload.exp === 'number') {
        return {
          pubkey: payload.pubkey,
          exp: payload.exp
        };
      }
      
      return null;
    } catch (error) {
      console.error('Session verification error:', error);
      return null;
    }
  }

  public async getUserIdFromToken(): Promise<string | null> {
    const session = await this.getSessionFromCookie();
    return session?.pubkey || null;
  }

  public async clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(AuthService.COOKIE_NAME);
    
    // Optionally clean up database session
    const userId = await this.getUserIdFromToken();
    if (userId) {
      this.db.deleteSession(userId);
    }
  }

  public async isAuthenticated(): Promise<boolean> {
    const session = await this.getSessionFromCookie();
    return session !== null;
  }

  public validateNostrPubkey(pubkey: string): boolean {
    // Basic validation for Nostr public key (64 hex characters)
    return /^[a-fA-F0-9]{64}$/.test(pubkey);
  }

  public validateNsecKey(nsec: string): boolean {
    // Basic validation for nsec key format
    return nsec.startsWith('nsec1') && nsec.length >= 60;
  }
}

export default AuthService;
