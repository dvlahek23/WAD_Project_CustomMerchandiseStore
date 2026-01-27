import { Router } from 'express';
import { db } from '../db/initDb';

const router = Router();

// Get all products with category info
router.get('/', async (req, res) => {
  try {
    const { category, type, search } = req.query;

    let query = `
      SELECT p.*, c.name as category_name
      FROM Product p
      JOIN Category c ON p.category_id = c.category_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      query += ' AND c.name = ?';
      params.push(category);
    }

    if (type) {
      query += ' AND p.product_type = ?';
      params.push(type);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.product_id';

    const rows = await db.all(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all categories
router.get('/categories', async (_req, res) => {
  try {
    const rows = await db.all('SELECT * FROM Category ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all product types
router.get('/types', async (_req, res) => {
  try {
    const rows = await db.all('SELECT DISTINCT product_type FROM Product ORDER BY product_type');
    res.json(rows.map((r: any) => r.product_type));
  } catch (err) {
    console.error('Error fetching product types:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const row = await db.get(`
      SELECT p.*, c.name as category_name
      FROM Product p
      JOIN Category c ON p.category_id = c.category_id
      WHERE p.product_id = ?
    `, [req.params.id]);

    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(row);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
