import Database from 'better-sqlite3';
import path from 'path';

class DatabaseService {
  private static instance: DatabaseService;
  private db: Database.Database;

  private constructor() {
    const dbPath = path.join(process.cwd(), 'sessions.db');
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
    // Create sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT UNIQUE NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // Session operations
  public createSession(userId: string): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO sessions (userId) VALUES (?)');
    stmt.run(userId);
  }

  public getSession(userId: string): any {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE userId = ?');
    return stmt.get(userId);
  }

  public deleteSession(userId: string): void {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE userId = ?');
    stmt.run(userId);
  }

  // Credentials operations
  public saveCredentials(userId: string, platform: string, encryptedCredentials: string): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO credentials (userId, platform, credentials) VALUES (?, ?, ?)');
    stmt.run(userId, platform, encryptedCredentials);
  }

  public getCredentials(userId: string, platform?: string): any[] {
    if (platform) {
      const stmt = this.db.prepare('SELECT * FROM credentials WHERE userId = ? AND platform = ?');
      return [stmt.get(userId, platform)].filter(Boolean);
    } else {
      const stmt = this.db.prepare('SELECT * FROM credentials WHERE userId = ?');
      return stmt.all(userId);
    }
  }

  public deleteCredentials(userId: string, platform: string): void {
    const stmt = this.db.prepare('DELETE FROM credentials WHERE userId = ? AND platform = ?');
    stmt.run(userId, platform);
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
