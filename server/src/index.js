import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import sessionRouter from './session.js';
import credentialsRouter from './credentials.js';
import postingRouter from './posting.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(sessionRouter);
app.use(credentialsRouter);
app.use(postingRouter);

// SQLite setup
const db = new sqlite3.Database('./yall.db', (err) => {
  if (err) console.error('Failed to connect to DB:', err);
  else console.log('Connected to SQLite DB');
});

// Export the db instance for use in other modules
export function getDB() {
  return db;
}

// Example route
app.get('/', (req, res) => {
  res.send('Yall Web Express backend running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
