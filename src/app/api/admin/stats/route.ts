import { NextRequest, NextResponse } from 'next/server';
import { AuthService, DatabaseService } from '@/services';
import { AdminService } from '@/services/AdminService';
import { getErrorLogs, logError } from '@/utils/errorLogger';

// Mock data storage - in production, this would come from your database
const postHistory = new Map<string, number>(); // date -> post count
const userHistory = new Map<string, number>(); // date -> new user count

export async function GET(request: NextRequest) {
  try {
    console.log('Admin stats API called');
    
    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    
    console.log('User ID from token:', userId);
    
    if (!userId) {
      console.log('No user ID, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminService = AdminService.getInstance();
    const isAdmin = await adminService.isUserAdmin(userId);
    console.log('Is user admin?', isAdmin);
    
    if (!isAdmin) {
      console.log('User is not admin, returning 403');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('Getting database instance...');
    const dbService = DatabaseService.getInstance();
    
    // Get all users and their credentials
    console.log('Getting credentials...');
    const allCredentials = dbService.getAllCredentials();
    console.log('Found credentials:', allCredentials.length);
    
    const userIds = new Set(allCredentials.map((cred: any) => cred.userId));
    
    // Count credentials by platform
    const credentialsCount = {
      twitter: allCredentials.filter((c: any) => c.platform === 'twitter').length,
      mastodon: allCredentials.filter((c: any) => c.platform === 'mastodon').length,
      bluesky: allCredentials.filter((c: any) => c.platform === 'bluesky').length,
      nostr: allCredentials.filter((c: any) => c.platform === 'nostr').length
    };

    // Mock platform breakdown (in a real app, you'd track this)
    const platformBreakdown = {
      twitter: Math.floor(Math.random() * 1000) + 500,
      mastodon: Math.floor(Math.random() * 500) + 200,
      bluesky: Math.floor(Math.random() * 800) + 300,
      nostr: Math.floor(Math.random() * 300) + 100
    };

    const totalPosts = Object.values(platformBreakdown).reduce((a, b) => a + b, 0);

    // Generate recent activity data (last 7 days)
    const recentActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      recentActivity.push({
        date: dateStr,
        posts: Math.floor(Math.random() * 50) + 10,
        newUsers: Math.floor(Math.random() * 5) + 1
      });
    }

    // System health (mock data)
    const uptimeMs = process.uptime() * 1000;
    const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const uptimeMins = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    const memUsed = process.memoryUsage();
    const memoryUsage = `${Math.round(memUsed.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsed.heapTotal / 1024 / 1024)}MB`;

    const stats = {
      totalUsers: userIds.size,
      totalPosts,
      platformBreakdown,
      credentialsCount,
      recentActivity,
      systemHealth: {
        uptime: `${uptimeHours}h ${uptimeMins}m`,
        memoryUsage,
        diskSpace: '45.2GB / 100GB (45%)',
        activeConnections: Math.floor(Math.random() * 20) + 5
      },
      userEngagement: {
        dailyActiveUsers: Math.min(userIds.size, Math.floor(userIds.size * 0.3) + 1),
        weeklyActiveUsers: Math.min(userIds.size, Math.floor(userIds.size * 0.7) + 1),
        monthlyActiveUsers: userIds.size,
        averagePostsPerUser: userIds.size > 0 ? totalPosts / userIds.size : 0
      },
      errorLogs: getErrorLogs().slice(0, 20), // Return last 20 errors
      autoDeleteStats: {
        usersWithAutoDelete: Math.floor(userIds.size * 0.2),
        pendingDeletions: Math.floor(Math.random() * 3)
      }
    };
    
    console.log('Returning stats:', Object.keys(stats));
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get admin stats:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    logError(`Admin stats error: ${error}`);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
