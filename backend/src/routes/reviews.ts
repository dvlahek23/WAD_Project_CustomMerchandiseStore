import express from 'express';
import { db } from '../db/initDb';

const router = express.Router();

// Middleware – treba login za pisanje/izmjenu/brisanje reviewa
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// GET /api/reviews?productId=...
router.get('/', async (req, res) => {
  const { productId } = req.query;

  let query = `
    SELECT r.review_id, r.product_id, r.customer_id, r.rating, r.comment, r.created_at,
           u.username as customer_name
    FROM Review r
    JOIN User u ON r.customer_id = u.user_id
  `;
  const params: any[] = [];

  if (productId) {
    query += ' WHERE r.product_id = ?';
    params.push(productId);
  }

  query += ' ORDER BY r.created_at DESC';

  const reviews = await db.all(query, params);
  res.json(reviews);
});

// POST /api/reviews
router.post('/', requireAuth, async (req, res) => {
  const customerId = req.session.userId!;
  const { product_id, rating, comment } = req.body;

  if (!product_id || rating == null) {
    return res.status(400).json({ error: 'product_id and rating are required' });
  }

  await db.run(
    `INSERT INTO Review (customer_id, product_id, rating, comment)
     VALUES (?, ?, ?, ?)`,
    [customerId, product_id, rating, comment || null]
  );

  res.status(201).json({ message: 'Review created' });
});

// PUT /api/reviews/:id
router.put('/:id', requireAuth, async (req, res) => {
  const customerId = req.session.userId!;
  const { id } = req.params;
  const { rating, comment } = req.body;

  const existing = await db.get<{ customer_id: number }>(
    'SELECT customer_id FROM Review WHERE review_id = ?',
    [id]
  );

  if (!existing) {
    return res.status(404).json({ error: 'Review not found' });
  }
  if (existing.customer_id !== customerId) {
    return res.status(403).json({ error: 'You can only edit your own reviews' });
  }

  await db.run(
    'UPDATE Review SET rating = ?, comment = ? WHERE review_id = ?',
    [rating, comment, id]
  );

  res.json({ message: 'Review updated' });
});

// DELETE /api/reviews/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const customerId = req.session.userId!;
  const { id } = req.params;

  const existing = await db.get<{ customer_id: number }>(
    'SELECT customer_id FROM Review WHERE review_id = ?',
    [id]
  );

  if (!existing) {
    return res.status(404).json({ error: 'Review not found' });
  }
  if (existing.customer_id !== customerId) {
    return res.status(403).json({ error: 'You can only delete your own reviews' });
  }

  await db.run('DELETE FROM Review WHERE review_id = ?', [id]);
  res.status(204).send();
});

export default router;
