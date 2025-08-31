// Database migration script to add posts table
const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'db/sessions.db');
console.log('Connecting to database:', dbPath);
const db = new Database(dbPath);

try {
  console.log('Adding posts table...');
  
  // Add the posts table
  db.exec(`
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
  
  console.log('Posts table created successfully');
  
  // Check the table structure
  const postsTableInfo = db.prepare("PRAGMA table_info(posts)").all();
  console.log('Posts table structure:', postsTableInfo);
  
  // List all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('All tables:', tables.map(t => t.name));
  
} catch (error) {
  console.error('Migration error:', error);
} finally {
  db.close();
  console.log('Migration completed');
}
