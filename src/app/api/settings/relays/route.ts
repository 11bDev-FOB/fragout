import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services';

// Default Nostr relays
const DEFAULT_RELAYS = [
  { url: 'wss://relay.damus.io', read: true, write: true },
  { url: 'wss://nos.lol', read: true, write: true },
  { url: 'wss://relay.nostr.band', read: true, write: true },
  { url: 'wss://nostr-pub.wellorder.net', read: true, write: true },
  { url: 'wss://relay.snort.social', read: true, write: true }
];

// In-memory storage for demo purposes
// In production, you'd want to use a proper database
const userRelays = new Map();

export async function GET(request: NextRequest) {
  try {
    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's relays or return defaults
    const relays = userRelays.get(userId) || DEFAULT_RELAYS;
    
    return NextResponse.json({ relays });
  } catch (error) {
    console.error('Failed to get relays:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { relays } = await request.json();
    
    // Validate relays
    if (!Array.isArray(relays)) {
      return NextResponse.json({ error: 'Invalid relays data' }, { status: 400 });
    }

    // Validate each relay
    for (const relay of relays) {
      if (!relay.url || typeof relay.url !== 'string') {
        return NextResponse.json({ error: 'Invalid relay URL' }, { status: 400 });
      }
      if (typeof relay.read !== 'boolean' || typeof relay.write !== 'boolean') {
        return NextResponse.json({ error: 'Invalid relay read/write flags' }, { status: 400 });
      }
    }

    // Store user's relays
    userRelays.set(userId, relays);
    
    return NextResponse.json({ success: true, relays });
  } catch (error) {
    console.error('Failed to update relays:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
