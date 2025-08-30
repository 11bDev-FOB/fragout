import { NextRequest, NextResponse } from 'next/server';
import { AuthService, DatabaseService } from '@/services';
import { AdminService } from '@/services/AdminService';
import { getErrorLogs, logError } from '@/utils/errorLogger';

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
    
    // Count credentials by platform (real data only)
    const credentialsCount = {
      twitter: allCredentials.filter((c: any) => c.platform === 'twitter').length,
      mastodon: allCredentials.filter((c: any) => c.platform === 'mastodon').length,
      bluesky: allCredentials.filter((c: any) => c.platform === 'bluesky').length,
      nostr: allCredentials.filter((c: any) => c.platform === 'nostr').length
    };

    // Real platform breakdown - no mock data
    // Note: In a real app, you'd track actual posts in the database
    const platformBreakdown = {
      twitter: 0, // No post tracking implemented yet
      mastodon: 0,
      bluesky: 0,
      nostr: 0
    };

    const totalPosts = Object.values(platformBreakdown).reduce((a, b) => a + b, 0);

    // Real recent activity - no mock data
    // Since we don't track posts yet, show zeros
    const recentActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      recentActivity.push({
        date: dateStr,
        posts: 0, // No post tracking yet
        newUsers: 0 // No user tracking by date yet
      });
    }

    // Real system health data
    const uptimeMs = process.uptime() * 1000;
    const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const uptimeMins = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    const memUsed = process.memoryUsage();
    const memoryUsage = `${Math.round(memUsed.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsed.heapTotal / 1024 / 1024)}MB`;

    // Get all sessions for active user count
    const allSessions = dbService.getAllSessions();
    
    // Calculate proper daily active users (sessions created in last 24 hours)
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentSessions = allSessions.filter((session: any) => {
      const sessionDate = new Date(session.created_at);
      return sessionDate >= dayAgo;
    });
    
    // Get unique users from recent sessions
    const uniqueRecentUsers = new Set(recentSessions.map((session: any) => session.pubkey));
    
    // Calculate weekly active users (sessions created in last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklySessions = allSessions.filter((session: any) => {
      const sessionDate = new Date(session.created_at);
      return sessionDate >= weekAgo;
    });
    const uniqueWeeklyUsers = new Set(weeklySessions.map((session: any) => session.pubkey));

    const stats = {
      totalUsers: userIds.size,
      totalPosts,
      platformBreakdown,
      credentialsCount,
      recentActivity,
      systemHealth: {
        uptime: `${uptimeHours}h ${uptimeMins}m`,
        memoryUsage,
        diskSpace: 'N/A', // Would need filesystem access to get real disk usage
        activeConnections: allSessions.length
      },
      userEngagement: {
        dailyActiveUsers: uniqueRecentUsers.size, // Unique users active in last 24h
        weeklyActiveUsers: uniqueWeeklyUsers.size, // Unique users active in last 7 days  
        monthlyActiveUsers: userIds.size, // All users with credentials
        averagePostsPerUser: userIds.size > 0 ? totalPosts / userIds.size : 0
      },
      errorLogs: getErrorLogs().slice(0, 20), // Return last 20 errors
      autoDeleteStats: {
        usersWithAutoDelete: 0, // No auto-delete tracking implemented yet
        pendingDeletions: 0
      }
    };
    
    console.log('Returning real stats:', Object.keys(stats));
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
