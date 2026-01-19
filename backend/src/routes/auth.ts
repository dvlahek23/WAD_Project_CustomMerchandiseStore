import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/initDb';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    roleId?: number;
  }
}

interface User {
  user_id: number;
  email: string;
  username: string;
  password_hash: string;
  role_id: number;
}

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const exists = await db.get(
    `SELECT user_id FROM User WHERE email = ? OR username = ?`,
    [email, username]
  );

  if (exists) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashed = await bcrypt.hash(password, 10);
  
  await db.run(
    `INSERT INTO User (email, username, password_hash, role_id, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
    [email, username, hashed, 2]
  );

  res.json({ message: 'Registered' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await db.get<User>(
    `SELECT * FROM User WHERE email = ?`,
    [email]
  );

  if (!user) return res.status(400).json({ error: 'Invalid email' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: 'Invalid password' });

  req.session.userId = user.user_id;
  req.session.roleId = user.role_id;

  res.json({ message: 'Logged in' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(200).json(null);
  }

  const user = await db.get<User>(
    `SELECT user_id, email, username, role_id FROM User WHERE user_id = ?`,
    [req.session.userId]
  );

  res.json(user);
});

export default router;

