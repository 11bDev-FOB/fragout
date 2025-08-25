import express from 'express';
import sqlite3 from 'sqlite3';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'replace_with_a_secure_secret';
// Generate a 32-byte hex key for AES-256
const CREDENTIAL_SECRET = process.env.CREDENTIAL_SECRET || crypto.randomBytes(32).toString('hex');

function getDB() {
  return new sqlite3.Database('./credentials.db');
}

function encrypt(text, secret) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(row, secret) {
  const [ivHex, encryptedHex] = row.credentials.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secret, 'hex'), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString());
}

function getUserIdFromToken(req) {
  const token = req.cookies.session;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.pubkey;
  } catch {
    return null;
  }
}

router.post('/api/credentials', (req, res) => {
  const { platform, credentials } = req.body;
  const secret = CREDENTIAL_SECRET;
  if (!secret) return res.status(500).json({ error: 'Server misconfigured' });
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const db = getDB();
  db.run(
    'CREATE TABLE IF NOT EXISTS credentials (id INTEGER PRIMARY KEY, userId TEXT, platform TEXT, credentials TEXT)',
    (err) => {
      if (err) {
        console.error('Failed to create credentials table:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      const encrypted = encrypt(JSON.stringify(credentials), secret);
      db.run(
        'INSERT INTO credentials (userId, platform, credentials) VALUES (?, ?, ?)',
        userId,
        platform,
        encrypted,
        (err) => {
          if (err) {
            console.error('Failed to insert credentials:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ success: true });
        }
      );
    }
  );
});

router.get('/api/credentials', (req, res) => {
  const secret = CREDENTIAL_SECRET;
  if (!secret) return res.status(500).json({ error: 'Server misconfigured' });
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const db = getDB();
  db.all('SELECT id, platform, credentials FROM credentials WHERE userId = ?', userId, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    const decryptedRows = rows.map(row => ({
      id: row.id,
      platform: row.platform,
      credentials: decrypt(row, secret),
    }));
    res.json({ credentials: decryptedRows });
  });
});

router.delete('/api/credentials', (req, res) => {
  const secret = CREDENTIAL_SECRET;
  if (!secret) return res.status(500).json({ error: 'Server misconfigured' });
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing credential id' });
  const db = getDB();
  db.run('DELETE FROM credentials WHERE id = ? AND userId = ?', id, userId, (err) => {
    if (err) {
      console.error('Failed to delete credentials:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

router.put('/api/credentials/:id', (req, res) => {
  const { platform, credentials } = req.body;
  const { id } = req.params;
  const secret = CREDENTIAL_SECRET;
  if (!secret) return res.status(500).json({ error: 'Server misconfigured' });
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  
  const db = getDB();
  const encrypted = encrypt(JSON.stringify(credentials), secret);
  db.run(
    'UPDATE credentials SET platform = ?, credentials = ? WHERE id = ? AND userId = ?',
    platform,
    encrypted,
    id,
    userId,
    (err) => {
      if (err) {
        console.error('Failed to update credentials:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    }
  );
});

router.post('/api/credentials/test', async (req, res) => {
  const { platform, credentials } = req.body;
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    let testResult = false;
    
    switch (platform) {
      case 'Mastodon':
        // Test Mastodon access token with instance
        if (credentials['Instance URL'] && credentials['Access Token']) {
          try {
            let instanceUrl = credentials['Instance URL'];
            // Ensure URL has protocol
            if (!instanceUrl.startsWith('http')) {
              instanceUrl = 'https://' + instanceUrl;
            }
            // Remove trailing slash
            instanceUrl = instanceUrl.replace(/\/$/, '');
            
            console.log(`Testing Mastodon connection to: ${instanceUrl}`);
            
            // Test by verifying credentials endpoint
            const response = await fetch(`${instanceUrl}/api/v1/accounts/verify_credentials`, {
              headers: {
                'Authorization': `Bearer ${credentials['Access Token']}`
              }
            });
            
            console.log(`Mastodon API response status: ${response.status}`);
            
            if (response.ok) {
              const accountData = await response.json();
              console.log(`Successfully connected to Mastodon as: ${accountData.username || 'unknown'}`);
              testResult = true;
            } else {
              let errorMessage = 'Invalid Mastodon credentials or instance URL';
              if (response.status === 401) {
                errorMessage = 'Invalid access token - please check your Mastodon access token';
              } else if (response.status === 404) {
                errorMessage = 'Mastodon instance not found - please check the instance URL';
              } else if (response.status >= 500) {
                errorMessage = 'Mastodon instance is experiencing issues - try again later';
              }
              return res.status(400).json({ error: errorMessage });
            }
          } catch (e) {
            console.error('Mastodon connection error:', e);
            if (e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED') {
              return res.status(400).json({ error: 'Could not reach Mastodon instance - please check the instance URL' });
            }
            return res.status(400).json({ error: 'Network error connecting to Mastodon instance' });
          }
        } else {
          return res.status(400).json({ error: 'Missing Instance URL or Access Token' });
        }
        break;
        
      case 'Bluesky':
        // Test Bluesky credentials
        if (credentials.Handle && credentials['App Password']) {
          // Basic format validation
          testResult = credentials.Handle.includes('.') && credentials['App Password'].length >= 8;
        }
        break;
        
      case 'X (Twitter)':
        // Test Twitter API credentials
        if (credentials['API Key'] && credentials['API Secret'] && 
            credentials['Access Token'] && credentials['Access Token Secret']) {
          // Basic format validation
          testResult = credentials['API Key'].length > 10 && 
                      credentials['API Secret'].length > 20;
        }
        break;
        
      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }
    
    if (testResult) {
      res.json({ success: true, message: 'Connection test passed' });
    } else {
      res.status(400).json({ error: 'Invalid credentials format' });
    }
  } catch (e) {
    console.error('Connection test error:', e);
    res.status(500).json({ error: 'Connection test failed' });
  }
});

export default router;
