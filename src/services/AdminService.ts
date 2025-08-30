/**
 * Secure Admin Management System
 * Replaces the insecure "first user becomes admin" logic
 */

import { DatabaseService } from '@/services';
import crypto from 'crypto';

export interface AdminConfig {
  adminPubkeys: string[];
  adminEmails?: string[];
  allowFirstUserAdmin: boolean; // Only for initial setup
  setupComplete: boolean;
}

export class AdminService {
  private static instance: AdminService;
  private db: DatabaseService;
  private config: AdminConfig;

  private constructor() {
    this.db = DatabaseService.getInstance();
    this.config = this.loadAdminConfig();
  }

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  /**
   * Load admin configuration from environment and database
   */
  private loadAdminConfig(): AdminConfig {
    // Check for admin configuration in environment variables
    const envAdminPubkeys = process.env.ADMIN_PUBKEYS?.split(',').map(k => k.trim()).filter(Boolean) || [];
    const envAdminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || [];
    const allowFirstUser = process.env.ALLOW_FIRST_USER_ADMIN === 'true';

    // Load any existing admin config from database
    const dbConfig = this.getAdminConfigFromDB();

    // Merge configuration with environment taking precedence
    const config: AdminConfig = {
      adminPubkeys: [...envAdminPubkeys, ...(dbConfig?.adminPubkeys || [])],
      adminEmails: [...envAdminEmails, ...(dbConfig?.adminEmails || [])],
      allowFirstUserAdmin: dbConfig?.setupComplete ? false : allowFirstUser, // Disable after setup
      setupComplete: dbConfig?.setupComplete || false
    };

    // If no admin configuration exists anywhere, warn
    if (config.adminPubkeys.length === 0 && !config.allowFirstUserAdmin) {
      console.warn('⚠️  WARNING: No admin configuration found. Set ADMIN_PUBKEYS environment variable or allow first user admin for initial setup.');
    }

    return config;
  }

  /**
   * Get admin configuration from database
   */
  private getAdminConfigFromDB(): AdminConfig | null {
    try {
      // This would be stored in your main database
      // For now, using a simple implementation
      return null; // Implement database storage as needed
    } catch (error) {
      console.error('Failed to load admin config from database:', error);
      return null;
    }
  }

  /**
   * Check if a user is an admin
   */
  public async isUserAdmin(userId: string): Promise<boolean> {
    try {
      // Check if user ID is in configured admin pubkeys
      if (this.config.adminPubkeys.includes(userId)) {
        return true;
      }

      // Handle first user admin logic (only if setup not complete)
      if (this.config.allowFirstUserAdmin && !this.config.setupComplete) {
        const hasAnyUsers = this.hasExistingUsers();
        if (!hasAnyUsers) {
          // This is the first user, grant admin and mark setup as complete
          await this.promoteUserToAdmin(userId);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Check if there are any existing users in the system
   */
  private hasExistingUsers(): boolean {
    try {
      const credentials = this.db.getAllCredentials();
      return credentials.length > 0;
    } catch (error) {
      console.error('Error checking existing users:', error);
      return true; // Fail safely - assume users exist
    }
  }

  /**
   * Promote a user to admin (for first user setup)
   */
  private async promoteUserToAdmin(userId: string): Promise<void> {
    try {
      console.log(`🔐 Promoting first user to admin: ${userId}`);
      
      // Add to admin list
      this.config.adminPubkeys.push(userId);
      this.config.setupComplete = true;
      this.config.allowFirstUserAdmin = false;

      // Save to database (implement as needed)
      // await this.saveAdminConfigToDB(this.config);

      console.log('✅ Admin setup complete. First user admin is now disabled.');
    } catch (error) {
      console.error('Failed to promote user to admin:', error);
      throw error;
    }
  }

  /**
   * Add a new admin (requires existing admin privileges)
   */
  public async addAdmin(newAdminId: string, requestingUserId: string): Promise<boolean> {
    try {
      // Verify requesting user is admin
      const isRequestingUserAdmin = await this.isUserAdmin(requestingUserId);
      if (!isRequestingUserAdmin) {
        throw new Error('Only admins can add new admins');
      }

      // Add new admin
      if (!this.config.adminPubkeys.includes(newAdminId)) {
        this.config.adminPubkeys.push(newAdminId);
        // Save to database
        console.log(`✅ Added new admin: ${newAdminId}`);
        return true;
      }

      return false; // Already admin
    } catch (error) {
      console.error('Failed to add admin:', error);
      throw error;
    }
  }

  /**
   * Remove an admin (requires existing admin privileges)
   */
  public async removeAdmin(adminToRemove: string, requestingUserId: string): Promise<boolean> {
    try {
      // Verify requesting user is admin
      const isRequestingUserAdmin = await this.isUserAdmin(requestingUserId);
      if (!isRequestingUserAdmin) {
        throw new Error('Only admins can remove admins');
      }

      // Prevent removing self if it would leave no admins
      if (adminToRemove === requestingUserId && this.config.adminPubkeys.length <= 1) {
        throw new Error('Cannot remove the last admin');
      }

      // Remove admin
      const index = this.config.adminPubkeys.indexOf(adminToRemove);
      if (index > -1) {
        this.config.adminPubkeys.splice(index, 1);
        // Save to database
        console.log(`✅ Removed admin: ${adminToRemove}`);
        return true;
      }

      return false; // Wasn't admin
    } catch (error) {
      console.error('Failed to remove admin:', error);
      throw error;
    }
  }

  /**
   * Get list of admin IDs (for admin management UI)
   */
  public async getAdminList(requestingUserId: string): Promise<string[]> {
    const isAdmin = await this.isUserAdmin(requestingUserId);
    if (!isAdmin) {
      throw new Error('Only admins can view admin list');
    }
    return [...this.config.adminPubkeys];
  }
}
