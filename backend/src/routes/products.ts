import { Router } from 'express';
import { db } from '../db/initDb';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const rows = await db.all('SELECT * FROM Product');
    res.json(rows);
  } catch (err) {
    console.error('Greška pri dohvaćanju proizvoda:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
