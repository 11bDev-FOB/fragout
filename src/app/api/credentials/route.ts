import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
// Helper to get DB connection
async function getDB() {
  return open({
    filename: './credentials.db',
    driver: sqlite3.Database,
  });
}

// Encrypt credentials before storing
function encrypt(text: string, secret: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export async function POST(request: Request) {
  const body = await request.json();
  const { platform, credentials } = body;
  const secret = process.env.CREDENTIAL_SECRET;
  if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  // Extract userId from JWT session cookie using next/headers
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'replace_with_a_secure_secret') as { pubkey: string };
    userId = decoded.pubkey;
  } catch (e) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const db = await getDB();
  await db.run(
    'CREATE TABLE IF NOT EXISTS credentials (id INTEGER PRIMARY KEY, userId TEXT, platform TEXT, credentials TEXT)'
  );
  const encrypted = encrypt(JSON.stringify(credentials), secret);
  await db.run(
    'INSERT INTO credentials (userId, platform, credentials) VALUES (?, ?, ?)',
    userId,
    platform,
    encrypted
  );
  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const secret = process.env.CREDENTIAL_SECRET;
  if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'replace_with_a_secure_secret') as { pubkey: string };
    userId = decoded.pubkey;
  } catch (e) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const db = await getDB();
  const rows = await db.all('SELECT id, platform, credentials FROM credentials WHERE userId = ?', userId);
  // Decrypt credentials
  const decryptedRows = rows.map((row: any) => {
    const [ivHex, encryptedHex] = row.credentials.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secret, 'hex'), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return {
      id: row.id,
      platform: row.platform,
      credentials: JSON.parse(decrypted.toString()),
    };
  });
  return NextResponse.json({ credentials: decryptedRows });
}

export async function DELETE(request: Request) {
  const secret = process.env.CREDENTIAL_SECRET;
  if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'replace_with_a_secure_secret') as { pubkey: string };
    userId = decoded.pubkey;
  } catch (e) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'Missing credential id' }, { status: 400 });

  const db = await getDB();
  await db.run('DELETE FROM credentials WHERE id = ? AND userId = ?', id, userId);
  return NextResponse.json({ success: true });
}
