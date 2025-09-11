import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/services';
import { cleanupInactiveUsers } from '@/utils/autoDelete';

export async function POST(request: NextRequest) {
  try {
    const adminService = AdminService.getInstance();
    
    // Check if user is admin
    const { userId } = await request.json();
    const isAdmin = await adminService.isUserAdmin(userId);
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Run the cleanup process
    console.log('🗑️ Running manual auto-delete cleanup...');
    cleanupInactiveUsers();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Auto-delete cleanup completed' 
    });
  } catch (error) {
    console.error('Failed to run auto-delete cleanup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
