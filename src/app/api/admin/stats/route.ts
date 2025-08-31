import { NextRequest, NextResponse } from 'next/server';
import { AuthService, DatabaseService } from '@/services';
import { AdminService } from '@/services/AdminService';
import { getErrorLogs, logError } from '@/utils/errorLogger';
import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs';

const execAsync = promisify(exec);

// Function to get disk space information
async function getDiskSpace(): Promise<string> {
  try {
    // Try different methods to get disk space
    
    // Method 1: Use df command (most reliable in Docker containers)
    try {
      const { stdout } = await execAsync('df -h /app 2>/dev/null || df -h / 2>/dev/null');
      const lines = stdout.trim().split('\n');
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        if (parts.length >= 4) {
          const total = parts[1];
          const used = parts[2];
          const available = parts[3];
          const usedPercent = parts[4];
          return `${used}/${total} (${available} free, ${usedPercent} used)`;
        }
      }
    } catch (dfError) {
      console.log('df command failed, trying statvfs approach...');
    }

    // Method 2: Use Node.js fs.statSync for basic info
    try {
      const stats = fs.statSync('/app');
      if (stats) {
        // Try to get filesystem info using /proc/mounts
        const mountInfo = fs.readFileSync('/proc/mounts', 'utf8');
        const appMount = mountInfo.split('\n').find(line => line.includes('/app') || line.includes('/'));
        if (appMount) {
          return 'Available (container filesystem)';
        }
      }
    } catch (fsError) {
      console.log('fs.statSync failed, using fallback...');
    }

    // Method 3: Check available space using a simple approach
    try {
      const { stdout } = await execAsync('du -sh /app 2>/dev/null');
      const appSize = stdout.trim().split('\t')[0];
      return `App: ${appSize} (container space)`;
    } catch (duError) {
      console.log('du command failed...');
    }

    return 'Container filesystem';
  } catch (error) {
    console.error('Error getting disk space:', error);
    return 'Unable to determine';
  }
}

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

    console.log('� CREDENTIALS COUNT CALCULATED:', credentialsCount);
    console.log('�💡 About to call dbService.getPostStats()...');
    
    // Get real post statistics from database
    console.log('Getting post statistics...');
    let postStats;
    try {
      postStats = dbService.getPostStats();
      console.log('Post stats result:', JSON.stringify(postStats, null, 2));
    } catch (error) {
      console.error('Error getting post stats:', error);
      // Fallback to empty stats
      postStats = {
        platformStats: [],
        recentActivity: [],
        totalPosts: 0
      };
      console.log('Using fallback empty post stats');
    }
    
    // Build platform breakdown from real data
    const platformBreakdown = {
      twitter: 0,
      mastodon: 0,
      bluesky: 0,
      nostr: 0
    };
    
    // Update with actual data from database
    postStats.platformStats.forEach((stat: any) => {
      if (platformBreakdown.hasOwnProperty(stat.platform)) {
        platformBreakdown[stat.platform as keyof typeof platformBreakdown] = stat.successful || 0;
      }
    });

    const totalPosts = postStats.totalPosts || 0;

    // Build recent activity from real data (last 7 days)
    const recentActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find data for this date from database
      const dayData = postStats.recentActivity.find((activity: any) => activity.date === dateStr);
      
      recentActivity.push({
        date: dateStr,
        posts: dayData ? dayData.posts : 0,
        newUsers: dayData ? dayData.active_users : 0
      });
    }

    // Real system health data
    console.log('🔍 Getting system health data...');
    const uptimeMs = process.uptime() * 1000;
    const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const uptimeMins = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    const memUsed = process.memoryUsage();
    const memoryUsage = `${Math.round(memUsed.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsed.heapTotal / 1024 / 1024)}MB`;

    // Get real disk space information
    console.log('💾 Getting disk space information...');
    const diskSpace = await getDiskSpace();
    console.log('💾 Disk space result:', diskSpace);

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
        diskSpace: diskSpace, // Real disk space information
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
