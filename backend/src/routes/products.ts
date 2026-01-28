import { Router } from 'express';
import express from 'express';
import { db } from '../db/initDb';

const router = Router();

// Middleware to check if user is admin or management
const requireManagement = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await db.get<{ role_name: string }>(
    `SELECT r.name as role_name FROM User u
     JOIN Role r ON u.role_id = r.role_id
     WHERE u.user_id = ?`,
    [req.session.userId]
  );

  const roleName = user?.role_name?.toLowerCase();
  if (!user || (roleName !== 'administrator' && roleName !== 'management')) {
    return res.status(403).json({ error: 'Admin or management access required' });
  }
  next();
};

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

// CREATE new product  (POST /api/products)
router.post('/', requireManagement, async (req, res) => {
  const { name, description, base_price, product_type, category_id, picture_url } = req.body;

  if (!name || !base_price || !product_type || !category_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await db.run(
      `INSERT INTO Product (name, description, base_price, product_type, category_id, picture_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description || null, base_price, product_type, category_id, picture_url || null]
    );

    const created = await db.get(
      `SELECT p.*, c.name as category_name
       FROM Product p
       JOIN Category c ON p.category_id = c.category_id
       WHERE p.product_id = ?`,
      [result.lastID]
    );

    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE product by ID (PUT /api/products/:id)
router.put('/:id', requireManagement, async (req, res) => {
  const { name, description, base_price, product_type, category_id, picture_url } = req.body;
  const { id } = req.params;

  try {
    const existing = await db.get<any>('SELECT * FROM Product WHERE product_id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await db.run(
      `UPDATE Product
       SET name = ?, description = ?, base_price = ?, product_type = ?, category_id = ?, picture_url = ?
       WHERE product_id = ?`,
      [
        name ?? existing.name,
        description ?? existing.description,
        base_price ?? existing.base_price,
        product_type ?? existing.product_type,
        category_id ?? existing.category_id,
        picture_url ?? existing.picture_url,
        id,
      ]
    );

    const updated = await db.get(
      `SELECT p.*, c.name AS category_name
       FROM Product p
       JOIN Category c ON p.category_id = c.category_id
       WHERE p.product_id = ?`,
      [id]
    );

    res.json(updated);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// DELETE product by ID (DELETE /api/products/:id)
router.delete('/:id', requireManagement, async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db.get('SELECT * FROM Product WHERE product_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await db.run('DELETE FROM Product WHERE product_id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;
