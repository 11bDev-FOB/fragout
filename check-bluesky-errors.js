const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'db/sessions.db');
const db = new Database(dbPath, { readonly: true });

console.log('\n📊 Bluesky Failed Posts Analysis\n');
console.log('=' .repeat(80));

const failedPosts = db.prepare(`
  SELECT 
    id,
    userId,
    postId,
    content_length,
    has_images,
    error_message,
    datetime(created_at, 'localtime') as created_at
  FROM posts 
  WHERE platform = 'bluesky' 
    AND success = 0 
  ORDER BY created_at DESC 
  LIMIT 10
`).all();

if (failedPosts.length === 0) {
  console.log('\n✅ No failed Bluesky posts found!\n');
} else {
  console.log(`\n❌ Found ${failedPosts.length} failed Bluesky posts:\n`);
  
  failedPosts.forEach((post, index) => {
    console.log(`\n${index + 1}. Post ID: ${post.id}`);
    console.log(`   Date: ${post.created_at}`);
    console.log(`   Content Length: ${post.content_length} characters`);
    console.log(`   Has Images: ${post.has_images ? 'Yes' : 'No'}`);
    console.log(`   Error: ${post.error_message || 'No error message recorded'}`);
    console.log('-'.repeat(80));
  });
}

// Get summary stats
const summary = db.prepare(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
    SUM(CASE WHEN success = 0 AND has_images = 1 THEN 1 ELSE 0 END) as failed_with_images,
    SUM(CASE WHEN success = 0 AND has_images = 0 THEN 1 ELSE 0 END) as failed_text_only
  FROM posts 
  WHERE platform = 'bluesky'
`).get();

console.log('\n📈 Bluesky Summary Statistics:\n');
console.log(`   Total Posts: ${summary.total}`);
console.log(`   Successful: ${summary.successful} (${((summary.successful/summary.total)*100).toFixed(1)}%)`);
console.log(`   Failed: ${summary.failed} (${((summary.failed/summary.total)*100).toFixed(1)}%)`);
console.log(`   Failed with Images: ${summary.failed_with_images}`);
console.log(`   Failed Text-Only: ${summary.failed_text_only}`);

// Get unique error messages
const errorTypes = db.prepare(`
  SELECT 
    error_message,
    COUNT(*) as count
  FROM posts 
  WHERE platform = 'bluesky' 
    AND success = 0
    AND error_message IS NOT NULL
  GROUP BY error_message
  ORDER BY count DESC
`).all();

if (errorTypes.length > 0) {
  console.log('\n🔍 Error Types:\n');
  errorTypes.forEach((err, index) => {
    console.log(`   ${index + 1}. ${err.error_message} (${err.count} occurrence${err.count > 1 ? 's' : ''})`);
  });
}

console.log('\n' + '='.repeat(80) + '\n');

db.close();
