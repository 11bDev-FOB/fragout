// Simple test script to verify admin functionality
const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'db/sessions.db');
console.log('Connecting to database:', dbPath);
const db = new Database(dbPath);

try {
  // Check if posts table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Database tables:', tables.map(t => t.name));

  // Check if posts table has the right structure
  const postsTableInfo = db.prepare("PRAGMA table_info(posts)").all();
  console.log('Posts table structure:', postsTableInfo);

  // Count existing posts
  const postCount = db.prepare("SELECT COUNT(*) as count FROM posts").get();
  console.log('Current post count:', postCount);

  // Insert a test post
  const insertPost = db.prepare(`
    INSERT INTO posts (userId, platform, postId, success, content_length, has_images, error_message) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertPost.run(
    '8dc8688200b447ec2e4018ea5e42dc5d480940cb3f19ca8f361d28179dc4ba5e', // User ID from logs
    'nostr',
    'test123',
    1, // success = true
    25, // content length
    0, // no images
    null // no error
  );

  console.log('Test post inserted successfully');

  // Verify the insert
  const newPostCount = db.prepare("SELECT COUNT(*) as count FROM posts").get();
  console.log('New post count:', newPostCount);

  // Test the getPostStats query
  const platformStats = db.prepare(`
    SELECT platform, 
           COUNT(*) as total,
           SUM(success) as successful,
           COUNT(*) - SUM(success) as failed
    FROM posts 
    GROUP BY platform
  `).all();
  
  console.log('Platform stats:', platformStats);

} catch (error) {
  console.error('Database error:', error);
} finally {
  db.close();
}
