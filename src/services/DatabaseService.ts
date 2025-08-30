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

  public close(): void {
    this.db.close();
  }
}

export default DatabaseService;
