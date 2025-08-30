import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services';
import { AdminService } from '@/services/AdminService';

export async function GET(request: NextRequest) {
  try {
    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminService = AdminService.getInstance();
    const isAdmin = await adminService.isUserAdmin(userId);
    
    return NextResponse.json({ 
      isAdmin,
      userId
    });
  } catch (error) {
    console.error('Failed to check admin status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
