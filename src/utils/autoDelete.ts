// Auto-delete utility
import DatabaseService from '@/services/DatabaseService';

const userAutoDeleteSettings = new Map();
const userLastActivity = new Map();

// Function to check and cleanup inactive users (would be called by a cron job)
export function cleanupInactiveUsers() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  for (const [userId, lastActivity] of userLastActivity.entries()) {
    const autoDeleteEnabled = userAutoDeleteSettings.get(userId);
    
    if (autoDeleteEnabled && lastActivity < thirtyDaysAgo) {
      console.log(`🗑️ Auto-deleting inactive user: ${userId}`);
      
      try {
        // Delete all user data from the database
        const dbService = DatabaseService.getInstance();
        dbService.deleteUser(userId);
        
        // Clean up in-memory maps
        userAutoDeleteSettings.delete(userId);
        userLastActivity.delete(userId);
        
        console.log(`✅ Successfully auto-deleted user: ${userId}`);
      } catch (error) {
        console.error(`❌ Failed to auto-delete user ${userId}:`, error);
      }
    }
  }
}

// Update user activity (call this when user performs actions)
export function updateUserActivity(userId: string) {
  userLastActivity.set(userId, new Date());
}

// Export the maps so the route can access them
export { userAutoDeleteSettings, userLastActivity };
