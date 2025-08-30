'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  platformBreakdown: {
    twitter: number;
    mastodon: number;
    bluesky: number;
    nostr: number;
  };
  credentialsCount: {
    twitter: number;
    mastodon: number;
    bluesky: number;
    nostr: number;
  };
  recentActivity: {
    date: string;
    posts: number;
    newUsers: number;
  }[];
  systemHealth: {
    uptime: string;
    memoryUsage: string;
    diskSpace: string;
    activeConnections: number;
  };
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averagePostsPerUser: number;
  };
  errorLogs: {
    timestamp: string;
    error: string;
    platform?: string;
  }[];
  autoDeleteStats: {
    usersWithAutoDelete: number;
    pendingDeletions: number;
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkAdminStatus();
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/check', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin);
        if (data.isAdmin) {
          await loadStats();
          // Auto-refresh every 30 seconds
          const interval = setInterval(loadStats, 30000);
          setRefreshInterval(interval);
        }
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Failed to check admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('Loading admin stats...');
      setStatsError(null);
      const response = await fetch('/api/admin/stats', {
        credentials: 'include'
      });
      
      console.log('Stats response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Stats data received:', data);
        setStats(data);
        setStatsError(null);
      } else {
        const errorText = await response.text();
        console.error('Stats API error:', response.status, errorText);
        setStatsError(`Failed to load stats: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to load admin stats:', error);
      setStatsError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearErrorLogs = async () => {
    try {
      const response = await fetch('/api/admin/clear-logs', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        await loadStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-200 via-orange-100 to-yellow-100 dark:from-gray-900 dark:via-red-900 dark:to-orange-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-700 dark:border-red-400 mx-auto mb-4"></div>
          <p className="text-xl text-red-700 dark:text-red-400 font-semibold">Checking admin access...</p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-200 via-orange-100 to-yellow-100 dark:from-gray-900 dark:via-red-900 dark:to-orange-900 flex items-center justify-center">
        <div className="text-center bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-lg p-8 border border-red-200 dark:border-red-700">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-red-700 dark:text-red-400 mb-4">Access Denied</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">You don't have permission to access this page.</p>
          <Link 
            href="/dashboard"
            className="inline-block bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-200 via-orange-100 to-yellow-100 dark:from-gray-900 dark:via-red-900 dark:to-orange-900">
      <Navigation currentPage="admin" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header */}
        <div className="text-center mb-8 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-lg p-8 border border-red-200 dark:border-gray-700">
          <h1 className="text-4xl font-extrabold mb-4 text-red-700 dark:text-red-400 drop-shadow">
            🛡️ Admin Dashboard
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            System statistics and management tools for Y'all Web
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Auto-refreshes every 30 seconds • Last updated: {stats ? new Date().toLocaleTimeString() : 'Loading...'}
          </p>
        </div>

        {/* Error Display */}
        {statsError && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/30 rounded-xl p-6 border border-red-200 dark:border-red-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-2xl mr-3">⚠️</div>
                <div>
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Statistics Loading Error</h3>
                  <p className="text-red-600 dark:text-red-300">{statsError}</p>
                </div>
              </div>
              <button
                onClick={loadStats}
                className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {stats && (
          <>
            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6 border border-blue-200 dark:border-blue-700 text-center">
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">{stats.totalUsers}</div>
                <div className="text-blue-600 dark:text-blue-300 font-semibold">Total Users</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-6 border border-green-200 dark:border-green-700 text-center">
                <div className="text-3xl font-bold text-green-700 dark:text-green-400">{stats.totalPosts}</div>
                <div className="text-green-600 dark:text-green-300 font-semibold">Total Posts</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-6 border border-purple-200 dark:border-purple-700 text-center">
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">{stats.userEngagement.dailyActiveUsers}</div>
                <div className="text-purple-600 dark:text-purple-300 font-semibold">Daily Active Users</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-6 border border-orange-200 dark:border-orange-700 text-center">
                <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">{stats.userEngagement.averagePostsPerUser.toFixed(1)}</div>
                <div className="text-orange-600 dark:text-orange-300 font-semibold">Avg Posts/User</div>
              </div>
            </div>

            {/* Platform Statistics */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">📊 Platform Usage</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-gray-700 dark:text-gray-300">
                      <span className="text-blue-500 mr-2">🐦</span>
                      X (Twitter)
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.platformBreakdown.twitter} posts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-gray-700 dark:text-gray-300">
                      <span className="text-indigo-500 mr-2">🐘</span>
                      Mastodon
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.platformBreakdown.mastodon} posts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-gray-700 dark:text-gray-300">
                      <span className="text-sky-500 mr-2">🦋</span>
                      BlueSky
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.platformBreakdown.bluesky} posts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-gray-700 dark:text-gray-300">
                      <span className="text-purple-500 mr-2">🟣</span>
                      Nostr
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.platformBreakdown.nostr} posts</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">🔑 Connected Accounts</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-gray-700 dark:text-gray-300">
                      <span className="text-blue-500 mr-2">🐦</span>
                      X (Twitter)
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.credentialsCount.twitter} accounts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-gray-700 dark:text-gray-300">
                      <span className="text-indigo-500 mr-2">🐘</span>
                      Mastodon
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.credentialsCount.mastodon} accounts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-gray-700 dark:text-gray-300">
                      <span className="text-sky-500 mr-2">🦋</span>
                      BlueSky
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.credentialsCount.bluesky} accounts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-gray-700 dark:text-gray-300">
                      <span className="text-purple-500 mr-2">🟣</span>
                      Nostr
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.credentialsCount.nostr} accounts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">💚 System Health</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{stats.systemHealth.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Memory Usage:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.systemHealth.memoryUsage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Disk Space:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.systemHealth.diskSpace}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Active Connections:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.systemHealth.activeConnections}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">👥 User Engagement</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Daily Active:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.userEngagement.dailyActiveUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Weekly Active:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{stats.userEngagement.weeklyActiveUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Monthly Active:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{stats.userEngagement.monthlyActiveUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Auto-Delete Users:</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">{stats.autoDeleteStats.usersWithAutoDelete}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">📈 Recent Activity (Last 7 Days)</h2>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                      <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Posts</th>
                      <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">New Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentActivity.map((day, index) => (
                      <tr key={index} className="border-b border-gray-200 dark:border-gray-600">
                        <td className="p-3 text-gray-800 dark:text-gray-200">{new Date(day.date).toLocaleDateString()}</td>
                        <td className="p-3 font-semibold text-green-600 dark:text-green-400">{day.posts}</td>
                        <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">{day.newUsers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Error Logs */}
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">🚨 Recent Errors</h2>
                <button
                  onClick={clearErrorLogs}
                  className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Clear Logs
                </button>
              </div>
              {stats.errorLogs.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stats.errorLogs.map((log, index) => (
                    <div key={index} className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-red-800 dark:text-red-300 font-mono text-sm">{log.error}</p>
                          {log.platform && (
                            <span className="inline-block bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs mt-1">
                              {log.platform}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent errors 🎉</p>
              )}
            </div>
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}
