import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import Database from 'better-sqlite3';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('🔴 CRITICAL: JWT_SECRET environment variable is required in production');
    }
    console.warn('⚠️  WARNING: Using fallback JWT_SECRET in session route');
    return 'development_fallback_secret_change_me_in_production';
  })()
);

// Helper to get DB connection
function getDB() {
  return new Database('./db/sessions.db');
}

function isValidNostrPubkey(pubkey: string) {
  // Nostr public keys are 64 hex chars, optionally prefixed with 'npub' (bech32)
  if (typeof pubkey !== 'string') return false;
  // Hex format
  if (/^[a-fA-F0-9]{64}$/.test(pubkey)) return true;
  // Bech32 format (npub...)
  if (/^npub[a-z0-9]{59}$/.test(pubkey)) return true;
  return false;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pubkey = body.pubkey;
    
    if (!pubkey || !isValidNostrPubkey(pubkey)) {
      return NextResponse.json({ error: 'Invalid Nostr public key' }, { status: 400 });
    }

    const db = getDB();
    
    // Create table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY, 
        pubkey TEXT, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert session
    const stmt = db.prepare('INSERT INTO sessions (pubkey) VALUES (?)');
    stmt.run(pubkey);
    
    console.log('API/session: Created session for pubkey:', pubkey);
    
    // Create JWT token using jose
    const token = await new SignJWT({ pubkey })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);
    
    console.log('API/session: Created JWT token');
    
    // Create response and set cookie
    const response = NextResponse.json({ success: true, pubkey });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    console.log('API/session: Set session cookie');
    db.close();
    
    return response;
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
