// Auto-delete utility
const userAutoDeleteSettings = new Map();
const userLastActivity = new Map();

// Function to check and cleanup inactive users (would be called by a cron job)
export function cleanupInactiveUsers() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  for (const [userId, lastActivity] of userLastActivity.entries()) {
    const autoDeleteEnabled = userAutoDeleteSettings.get(userId);
    
    if (autoDeleteEnabled && lastActivity < thirtyDaysAgo) {
      console.log(`Auto-deleting inactive user: ${userId}`);
      // Clean up user data
      userAutoDeleteSettings.delete(userId);
      userLastActivity.delete(userId);
      // Here you would also delete from the main database
      // DatabaseService.getInstance().deleteUser(userId);
    }
  }
}

// Export the maps so the route can access them
export { userAutoDeleteSettings, userLastActivity };
