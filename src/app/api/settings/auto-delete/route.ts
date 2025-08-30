import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services';
import { userAutoDeleteSettings, userLastActivity } from '@/utils/autoDelete';

export async function GET(request: NextRequest) {
  try {
    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enabled = userAutoDeleteSettings.get(userId) || false;
    const lastActivity = userLastActivity.get(userId) || new Date();
    
    return NextResponse.json({ 
      enabled,
      lastActivity: lastActivity.toISOString()
    });
  } catch (error) {
    console.error('Failed to get auto-delete settings:', error);
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

    const { enabled } = await request.json();
    
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid enabled value' }, { status: 400 });
    }

    // Store the setting
    userAutoDeleteSettings.set(userId, enabled);
    
    // Update last activity
    userLastActivity.set(userId, new Date());
    
    return NextResponse.json({ 
      success: true, 
      enabled,
      lastActivity: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to update auto-delete settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
