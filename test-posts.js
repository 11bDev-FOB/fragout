import DatabaseService from '../services/DatabaseService.js';

console.log('🧪 Testing post tracking system...');

const dbService = DatabaseService.getInstance();

// Insert test posts
console.log('📝 Adding test posts...');
dbService.recordPost('test-user', 'nostr', true, 'note123', 100, false);
dbService.recordPost('test-user', 'twitter', true, 'tweet456', 280, true);
dbService.recordPost('test-user', 'bluesky', false, null, 150, false, 'Authentication failed');
dbService.recordPost('test-user', 'mastodon', true, 'toot789', 200, true);

console.log('✅ Test posts added!');

// Test the getPostStats method
console.log('📊 Testing getPostStats...');
const stats = dbService.getPostStats();
console.log('Stats result:', JSON.stringify(stats, null, 2));

console.log('🎉 Test completed!');
