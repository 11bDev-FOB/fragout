import { NextResponse } from 'next/server';
import { AuthService, platformRegistry } from '@/services';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, credentials } = body;
    
    console.log('Test request received:', { platform, credentials: Object.keys(credentials || {}) });
    
    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get platform service
    const platformService = platformRegistry.getPlatform(platform);
    if (!platformService) {
      return NextResponse.json({ 
        error: `Unsupported platform: ${platform}` 
      }, { status: 400 });
    }

    // Test connection using platform service
    const testResult = await platformService.testConnection(credentials);
    
    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      data: testResult.data
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
