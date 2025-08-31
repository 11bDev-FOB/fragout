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

  public close(): void {
    this.db.close();
  }
}

export default DatabaseService;
