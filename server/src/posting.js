import express from 'express';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'replace_with_a_secure_secret';
const CREDENTIAL_SECRET = process.env.CREDENTIAL_SECRET || crypto.randomBytes(32).toString('hex');

// Helper to get DB connection (same as credentials.js)
function getDB() {
  return new sqlite3.Database('./credentials.db');
}

// JWT helper function (same as credentials.js)
function getUserIdFromToken(req) {
  const token = req.cookies?.session;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.pubkey;
  } catch (e) {
    return null;
  }
}

// Decrypt function (same as in credentials.js)
function decrypt(row, secret) {
  try {
    const parts = row.credentials.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secret, 'hex'), iv);
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (e) {
    console.error('Decryption failed:', e);
    return null;
  }
}

// Post to multiple platforms
router.post('/api/post', async (req, res) => {
  const { message, platforms } = req.body;
  const userId = getUserIdFromToken(req);
  
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });
  if (!platforms || platforms.length === 0) return res.status(400).json({ error: 'At least one platform must be selected' });

  const db = getDB();
  
  try {
    // Get user's credentials for the selected platforms
    const credentials = await new Promise((resolve, reject) => {
      db.all('SELECT platform, credentials FROM credentials WHERE userId = ?', userId, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const decryptedCredentials = {};
    credentials.forEach(row => {
      const decrypted = decrypt(row, CREDENTIAL_SECRET);
      if (decrypted) {
        decryptedCredentials[row.platform] = decrypted;
      }
    });

    const results = {};
    const errors = {};

    // Post to each selected platform
    for (const platform of platforms) {
      if (!decryptedCredentials[platform]) {
        errors[platform] = 'No credentials found for this platform';
        continue;
      }

      try {
        switch (platform) {
          case 'Mastodon':
            await postToMastodon(message, decryptedCredentials[platform]);
            results[platform] = 'Success';
            break;
          
          case 'Bluesky':
            await postToBluesky(message, decryptedCredentials[platform]);
            results[platform] = 'Success';
            break;
          
          case 'X (Twitter)':
            await postToTwitter(message, decryptedCredentials[platform]);
            results[platform] = 'Success';
            break;
          
          case 'Nostr':
            await postToNostr(message, decryptedCredentials[platform]);
            results[platform] = 'Success';
            break;
          
          default:
            errors[platform] = 'Platform not supported';
        }
      } catch (e) {
        console.error(`Error posting to ${platform}:`, e);
        errors[platform] = e.message || 'Failed to post';
      }
    }

    res.json({ results, errors });
  } catch (e) {
    console.error('Post API error:', e);
    res.status(500).json({ error: 'Failed to process post request' });
  }
});

// Platform-specific posting functions
async function postToMastodon(message, credentials) {
  let instanceUrl = credentials['Instance URL'];
  if (!instanceUrl.startsWith('http')) {
    instanceUrl = 'https://' + instanceUrl;
  }
  instanceUrl = instanceUrl.replace(/\/$/, '');

  const response = await fetch(`${instanceUrl}/api/v1/statuses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials['Access Token']}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: message
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mastodon API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function postToBluesky(message, credentials) {
  // First, get an access token
  const authResponse = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: credentials.Handle,
      password: credentials['App Password']
    })
  });

  if (!authResponse.ok) {
    throw new Error('Failed to authenticate with Bluesky');
  }

  const authData = await authResponse.json();

  // Post the message
  const postResponse = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authData.accessJwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      repo: authData.did,
      collection: 'app.bsky.feed.post',
      record: {
        text: message,
        createdAt: new Date().toISOString()
      }
    })
  });

  if (!postResponse.ok) {
    const error = await postResponse.text();
    throw new Error(`Bluesky API error: ${postResponse.status} - ${error}`);
  }

  return await postResponse.json();
}

async function postToTwitter(message, credentials) {
  // Note: Twitter API v2 requires OAuth 1.0a which is complex
  // For now, this is a placeholder - you'd need a proper OAuth library
  throw new Error('Twitter posting requires additional OAuth implementation');
}

async function postToNostr(message, credentials) {
  // Nostr posting would require the user's private key or browser extension
  // Since we're using Nip-07, we'd need to handle this on the frontend
  throw new Error('Nostr posting should be handled via browser extension');
}

export default router;
