import Database from 'better-sqlite3';
import path from 'path';

class DatabaseService {
  private static instance: DatabaseService;
  private db: Database.Database;

  private constructor() {
    const dbPath = path.join(process.cwd(), 'db/sessions.db');
    this.db = new Database(dbPath);
    this.initialize();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private initialize(): void {
    // Create sessions table with pubkey column (matching session API)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pubkey TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create credentials table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        platform TEXT NOT NULL,
        credentials TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(userId, platform)
      )
    `);

    // Create posts table for tracking platform usage
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        platform TEXT NOT NULL,
        postId TEXT,
        success INTEGER NOT NULL,
        content_length INTEGER,
        has_images INTEGER DEFAULT 0,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table for username/password authentication
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        user_id TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        failed_attempts INTEGER DEFAULT 0,
        locked_until DATETIME
      )
    `);

    // Create user_sessions table for enhanced session management
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        auth_type TEXT NOT NULL, -- 'nostr' or 'username'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT
      )
    `);

    // Create user_2fa table for two-factor authentication
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_2fa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        secret TEXT NOT NULL,
        backup_codes TEXT, -- JSON array of backup codes
        enabled INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create auth_attempts table for rate limiting
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS auth_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        identifier TEXT NOT NULL, -- IP or username
        attempt_type TEXT NOT NULL, -- 'login', '2fa'
        success INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  }

  // Session operations - updated to use pubkey
  public createSession(pubkey: string): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO sessions (pubkey) VALUES (?)');
    stmt.run(pubkey);
  }

  public getSession(pubkey: string): any {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE pubkey = ?');
    return stmt.get(pubkey);
  }

  public deleteSession(pubkey: string): void {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE pubkey = ?');
    stmt.run(pubkey);
  }

  // Credentials operations - using pubkey instead of userId for consistency
  public saveCredentials(pubkey: string, platform: string, encryptedCredentials: string): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO credentials (userId, platform, credentials) VALUES (?, ?, ?)');
    stmt.run(pubkey, platform, encryptedCredentials);
  }

  public getCredentials(pubkey: string, platform?: string): any[] {
    if (platform) {
      const stmt = this.db.prepare('SELECT * FROM credentials WHERE userId = ? AND platform = ?');
      return [stmt.get(pubkey, platform)].filter(Boolean);
    } else {
      const stmt = this.db.prepare('SELECT * FROM credentials WHERE userId = ?');
      return stmt.all(pubkey);
    }
  }

  public deleteCredentials(pubkey: string, platform: string): void {
    const stmt = this.db.prepare('DELETE FROM credentials WHERE userId = ? AND platform = ?');
    stmt.run(pubkey, platform);
  }

  // Admin operations
  public getAllCredentials(): any[] {
    const stmt = this.db.prepare('SELECT * FROM credentials');
    return stmt.all();
  }

  public getAllSessions(): any[] {
    const stmt = this.db.prepare('SELECT * FROM sessions');
    return stmt.all();
  }

  // Post tracking operations
  public recordPost(userId: string, platform: string, success: boolean, postId?: string, contentLength?: number, hasImages?: boolean, errorMessage?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO posts (userId, platform, postId, success, content_length, has_images, error_message) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(userId, platform, postId || null, success ? 1 : 0, contentLength || null, hasImages ? 1 : 0, errorMessage || null);
  }

  public getPostStats(): any {
    console.log('📊 DatabaseService.getPostStats() called');
    
    // Total posts by platform
    console.log('📊 Querying platform stats...');
    const platformStats = this.db.prepare(`
      SELECT platform, 
             COUNT(*) as total,
             SUM(success) as successful,
             COUNT(*) - SUM(success) as failed
      FROM posts 
      GROUP BY platform
    `).all();
    console.log('📊 Platform stats result:', platformStats);

    // Recent activity (last 7 days)
    console.log('📊 Querying recent activity...');
    const recentActivity = this.db.prepare(`
      SELECT DATE(created_at) as date,
             COUNT(*) as posts,
             COUNT(DISTINCT userId) as active_users
      FROM posts 
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all();
    console.log('📊 Recent activity result:', recentActivity);

    // Total posts
    console.log('📊 Querying total posts...');
    const totalPosts = this.db.prepare('SELECT COUNT(*) as count FROM posts WHERE success = 1').get() as { count: number };
    console.log('📊 Total posts result:', totalPosts);

    const result = {
      platformStats,
      recentActivity,
      totalPosts: totalPosts.count
    };
    
    console.log('📊 Final getPostStats result:', result);
    return result;
  }

  public getAllPosts(): any[] {
    const stmt = this.db.prepare('SELECT * FROM posts ORDER BY created_at DESC');
    return stmt.all();
  }

  // Username/Password User Management
  public createUser(username: string, passwordHash: string, userId: string): void {
    const stmt = this.db.prepare('INSERT INTO users (username, password_hash, user_id) VALUES (?, ?, ?)');
    stmt.run(username, passwordHash, userId);
  }

  public getUserByUsername(username: string): any {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  public getUserById(userId: string): any {
    const stmt = this.db.prepare('SELECT * FROM users WHERE user_id = ?');
    return stmt.get(userId);
  }

  public updateUserLastLogin(userId: string): void {
    const stmt = this.db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP, failed_attempts = 0 WHERE user_id = ?');
    stmt.run(userId);
  }

  public incrementFailedAttempts(username: string): void {
    const stmt = this.db.prepare('UPDATE users SET failed_attempts = failed_attempts + 1 WHERE username = ?');
    stmt.run(username);
  }

  public lockUser(username: string, lockDurationMinutes: number = 15): void {
    const stmt = this.db.prepare('UPDATE users SET locked_until = datetime(\'now\', \'+\' || ? || \' minutes\') WHERE username = ?');
    stmt.run(lockDurationMinutes, username);
  }

  public isUserLocked(username: string): boolean {
    const stmt = this.db.prepare('SELECT locked_until FROM users WHERE username = ? AND locked_until > datetime(\'now\')');
    return stmt.get(username) !== undefined;
  }

  // Enhanced Session Management
  public createUserSession(sessionId: string, userId: string, authType: string, expiresAt: Date, ipAddress?: string, userAgent?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO user_sessions (session_id, user_id, auth_type, expires_at, ip_address, user_agent) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(sessionId, userId, authType, expiresAt.toISOString(), ipAddress, userAgent);
  }

  public getUserSession(sessionId: string): any {
    const stmt = this.db.prepare('SELECT * FROM user_sessions WHERE session_id = ? AND expires_at > datetime(\'now\')');
    return stmt.get(sessionId);
  }

  public updateSessionActivity(sessionId: string): void {
    const stmt = this.db.prepare('UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = ?');
    stmt.run(sessionId);
  }

  public deleteUserSession(sessionId: string): void {
    const stmt = this.db.prepare('DELETE FROM user_sessions WHERE session_id = ?');
    stmt.run(sessionId);
  }

  public deleteUserSessions(userId: string): void {
    const stmt = this.db.prepare('DELETE FROM user_sessions WHERE user_id = ?');
    stmt.run(userId);
  }

  public getUserSessions(userId: string): any[] {
    const stmt = this.db.prepare('SELECT * FROM user_sessions WHERE user_id = ? AND expires_at > datetime(\'now\') ORDER BY last_activity DESC');
    return stmt.all(userId);
  }

  // 2FA Management
  public setup2FA(userId: string, secret: string, backupCodes: string[]): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO user_2fa (user_id, secret, backup_codes) VALUES (?, ?, ?)');
    stmt.run(userId, secret, JSON.stringify(backupCodes));
  }

  public enable2FA(userId: string): void {
    const stmt = this.db.prepare('UPDATE user_2fa SET enabled = 1 WHERE user_id = ?');
    stmt.run(userId);
  }

  public disable2FA(userId: string): void {
    const stmt = this.db.prepare('UPDATE user_2fa SET enabled = 0 WHERE user_id = ?');
    stmt.run(userId);
  }

  public get2FA(userId: string): any {
    const stmt = this.db.prepare('SELECT * FROM user_2fa WHERE user_id = ?');
    return stmt.get(userId);
  }

  public useBackupCode(userId: string, code: string): boolean {
    const record = this.get2FA(userId);
    if (!record || !record.backup_codes) return false;
    
    const backupCodes = JSON.parse(record.backup_codes);
    const codeIndex = backupCodes.indexOf(code);
    
    if (codeIndex === -1) return false;
    
    // Remove the used backup code
    backupCodes.splice(codeIndex, 1);
    const stmt = this.db.prepare('UPDATE user_2fa SET backup_codes = ? WHERE user_id = ?');
    stmt.run(JSON.stringify(backupCodes), userId);
    
    return true;
  }

  // Rate Limiting
  public recordAuthAttempt(identifier: string, attemptType: string, success: boolean): void {
    const stmt = this.db.prepare('INSERT INTO auth_attempts (identifier, attempt_type, success) VALUES (?, ?, ?)');
    stmt.run(identifier, attemptType, success ? 1 : 0);
  }

  public getRecentFailedAttempts(identifier: string, attemptType: string, windowMinutes: number = 15): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM auth_attempts 
      WHERE identifier = ? 
      AND attempt_type = ? 
      AND success = 0 
      AND created_at > datetime('now', '-' || ? || ' minutes')
    `);
    const result = stmt.get(identifier, attemptType, windowMinutes) as { count: number };
    return result.count;
  }

  // Complete user deletion for auto-delete functionality
  public deleteUser(userId: string): void {
    const transaction = this.db.transaction(() => {
      // Delete platform credentials
      const deleteCredentials = this.db.prepare('DELETE FROM credentials WHERE userId = ?');
      deleteCredentials.run(userId);
      
      // Delete post history
      const deletePosts = this.db.prepare('DELETE FROM posts WHERE userId = ?');
      deletePosts.run(userId);
      
      // Delete user sessions
      const deleteUserSessions = this.db.prepare('DELETE FROM user_sessions WHERE user_id = ?');
      deleteUserSessions.run(userId);
      
      // Delete 2FA data
      const delete2FA = this.db.prepare('DELETE FROM user_2fa WHERE user_id = ?');
      delete2FA.run(userId);
      
      // Delete auth attempts (by user_id if it's a username user)
      const deleteAuthAttempts = this.db.prepare('DELETE FROM auth_attempts WHERE identifier = ?');
      deleteAuthAttempts.run(userId);
      
      // Check if this is a username/password user and delete user record
      const getUserRecord = this.db.prepare('SELECT * FROM users WHERE user_id = ?');
      const userRecord = getUserRecord.get(userId) as { username?: string } | undefined;
      if (userRecord && userRecord.username) {
        // Delete from users table
        const deleteUser = this.db.prepare('DELETE FROM users WHERE user_id = ?');
        deleteUser.run(userId);
        
        // Also delete auth attempts by username
        const deleteAuthAttemptsByUsername = this.db.prepare('DELETE FROM auth_attempts WHERE identifier = ?');
        deleteAuthAttemptsByUsername.run(userRecord.username);
      }
      
      // For Nostr users, also clean up the old sessions table if using pubkey
      const deleteNostrSession = this.db.prepare('DELETE FROM sessions WHERE pubkey = ?');
      deleteNostrSession.run(userId);
    });
    
    transaction();
    console.log(`🗑️ Auto-deleted all data for user: ${userId}`);
  }

  public close(): void {
    this.db.close();
  }
}

export default DatabaseService;
