import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services';

// Import the error logs from the stats endpoint
let errorLogs: Array<{timestamp: string, error: string, platform?: string}> = [];

// Check if user is admin (same logic as check endpoint)
let firstUserId: string | null = null;

async function isUserAdmin(userId: string): Promise<boolean> {
  if (!firstUserId) {
    firstUserId = userId;
  }
  return userId === firstUserId;
}

export async function POST(request: NextRequest) {
  try {
    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!(await isUserAdmin(userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Clear the error logs
    errorLogs.length = 0;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Error logs cleared successfully' 
    });
  } catch (error) {
    console.error('Failed to clear error logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
