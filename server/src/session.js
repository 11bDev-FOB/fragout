import express from 'express';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'replace_with_a_secure_secret';

// Helper to get DB connection
function getDB() {
  return new sqlite3.Database('./sessions.db');
}

function isValidNostrPubkey(pubkey) {
  // Nostr public keys are 64 hex chars, optionally prefixed with 'npub' (bech32)
  if (typeof pubkey !== 'string') return false;
  // Hex format
  if (/^[a-fA-F0-9]{64}$/.test(pubkey)) return true;
  // Bech32 format (npub...)
  if (/^npub[a-z0-9]{59}$/.test(pubkey)) return true;
  return false;
}

router.post('/api/session', async (req, res) => {
  const pubkey = req.body.pubkey;
  if (!pubkey || !isValidNostrPubkey(pubkey)) {
    return res.status(400).json({ error: 'Invalid Nostr public key' });
  }
  const db = getDB();
  db.run(
    'CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY, pubkey TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
    (err) => {
      if (err) {
        console.error('Failed to create sessions table:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      db.run(
        'INSERT INTO sessions (pubkey) VALUES (?)',
        pubkey,
        (err) => {
          if (err) {
            console.error('Failed to insert session:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          // Create JWT token
          const token = jwt.sign({ pubkey }, JWT_SECRET, { expiresIn: '7d' });
          console.log('API/session: Created JWT token:', token);
          // Set token as HttpOnly cookie
          res.cookie('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });
          console.log('API/session: Set session cookie');
          res.json({ success: true, pubkey });
        }
      );
    }
  );
});

export default router;
