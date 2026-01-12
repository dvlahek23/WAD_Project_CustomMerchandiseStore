import { Router } from 'express';
import { db } from '../db/initDb';

const router = Router();

router.get('/', (_req, res) => {
  db.all('SELECT * FROM Product', (err, rows) => {
    if (err) {
      console.error('Greška pri dohvaćanju proizvoda:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.json(rows);
  });
});

export default router;
