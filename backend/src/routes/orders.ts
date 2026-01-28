import express from 'express';
import { db } from '../db/initDb';

const router = express.Router();

// Order statuses:
// - pending_design: Waiting for designer review
// - design_approved: Designer approved, waiting for payment
// - design_rejected: Designer rejected, customer can revise
// - paid: Payment received, waiting for shipment
// - shipped: Order shipped
// - completed: Order delivered

// Middleware to check if user is logged in
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Helper to check if user is a designer
async function isDesigner(userId: number): Promise<boolean> {
  const designerType = await db.get<{ user_type_id: number }>(
    `SELECT user_type_id FROM RegularUserType WHERE LOWER(name) = 'designer'`
  );
  if (!designerType) return false;

  const hasType = await db.get(
    `SELECT * FROM User_RegularUserType WHERE user_id = ? AND user_type_id = ?`,
    [userId, designerType.user_type_id]
  );
  return !!hasType;
}

// Helper to check if user is management
async function isManagement(userId: number): Promise<boolean> {
  const user = await db.get<{ role_name: string }>(
    `SELECT r.name as role_name FROM User u
     JOIN Role r ON u.role_id = r.role_id
     WHERE u.user_id = ?`,
    [userId]
  );
  const roleName = user?.role_name?.toLowerCase();
  return roleName === 'management' || roleName === 'administrator';
}

// Place a new order
router.post('/', requireAuth, async (req, res) => {
  const customerId = req.session.userId!;
  const { productId, quantity, customText, textColor, textPositionX, textPositionY, textWidth, textHeight,
          customImage, imagePositionX, imagePositionY, imageWidth, imageHeight } = req.body;

  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  // Get product price
  const product = await db.get<{ base_price: number }>(
    `SELECT base_price FROM Product WHERE product_id = ?`,
    [productId]
  );

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const totalAmount = product.base_price * quantity;

  try {
    // Create order
    const orderResult = await db.run(
      `INSERT INTO "Order" (customer_id, order_date, total_amount, status, payment_method)
       VALUES (?, datetime('now'), ?, 'pending_design', 'pending')`,
      [customerId, totalAmount]
    );

    const orderId = orderResult.lastID;

    // Create order item with customization
    await db.run(
      `INSERT INTO OrderItem (order_id, product_id, quantity, unit_price,
        custom_text, text_color, text_position_x, text_position_y, text_width, text_height,
        custom_image, image_position_x, image_position_y, image_width, image_height)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, productId, quantity, product.base_price,
       customText || null, textColor || null, textPositionX || null, textPositionY || null, textWidth || null, textHeight || null,
       customImage || null, imagePositionX || null, imagePositionY || null, imageWidth || null, imageHeight || null]
    );

    res.json({ message: 'Order placed successfully', orderId });
  } catch (err: any) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: `Failed to create order: ${err.message}` });
  }
});



// GET /api/orders - all orders for logged-in user (alias to /my-orders)
router.get('/', requireAuth, async (req, res) => {
  const customerId = req.session.userId!;

  const orders = await db.all(
    `SELECT o.*, oi.*, p.name as product_name, p.picture_url
     FROM "Order" o
     JOIN OrderItem oi ON o.order_id = oi.order_id
     JOIN Product p ON oi.product_id = p.product_id
     WHERE o.customer_id = ?
     ORDER BY o.order_date DESC`,
    [customerId]
  );

  res.json(orders);
});



// Get customer's own orders
router.get('/my-orders', requireAuth, async (req, res) => {
  const customerId = req.session.userId!;

  const orders = await db.all(
    `SELECT o.*, oi.*, p.name as product_name, p.picture_url
     FROM "Order" o
     JOIN OrderItem oi ON o.order_id = oi.order_id
     JOIN Product p ON oi.product_id = p.product_id
     WHERE o.customer_id = ?
     ORDER BY o.order_date DESC`,
    [customerId]
  );

  res.json(orders);
});

// Get orders pending designer review
router.get('/pending-design', requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  // Check if user is a designer
  if (!(await isDesigner(userId))) {
    return res.status(403).json({ error: 'Designer access required' });
  }

  const orders = await db.all(
    `SELECT o.*, oi.*, p.name as product_name, p.picture_url, u.username as customer_name
     FROM "Order" o
     JOIN OrderItem oi ON o.order_id = oi.order_id
     JOIN Product p ON oi.product_id = p.product_id
     JOIN User u ON o.customer_id = u.user_id
     WHERE o.status = 'pending_design'
     ORDER BY o.order_date ASC`,
    []
  );

  res.json(orders);
});

// GET /api/orders/:orderId/status - returns order status
router.get('/:orderId/status', requireAuth, async (req, res) => {
  const { orderId } = req.params;

  const order = await db.get<{ status: string }>(
    `SELECT status FROM "Order" WHERE order_id = ?`,
    [orderId]
  );

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json({ status: order.status });
});

// PUT /api/orders/:orderId/status - updates order status (simplified)
router.put('/:orderId/status', requireAuth, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    'pending_design',
    'design_approved',
    'design_rejected',
    'paid',
    'shipped',
    'completed',
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const order = await db.get(
    `SELECT * FROM "Order" WHERE order_id = ?`,
    [orderId]
  );

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  await db.run(
    `UPDATE "Order" SET status = ? WHERE order_id = ?`,
    [status, orderId]
  );

  res.json({ message: 'Status updated', status });
});


// GET /api/orders/:orderId/items - all items in an order
router.get('/:orderId/items', requireAuth, async (req, res) => {
  const { orderId } = req.params;

  const items = await db.all(
    `SELECT oi.*, p.name as product_name, p.picture_url
     FROM OrderItem oi
     JOIN Product p ON oi.product_id = p.product_id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  res.json(items);
});


// Designer approves design
router.post('/:orderId/approve-design', requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const orderId = req.params.orderId;

  if (!(await isDesigner(userId))) {
    return res.status(403).json({ error: 'Designer access required' });
  }

  const order = await db.get<{ status: string }>(
    `SELECT status FROM "Order" WHERE order_id = ?`,
    [orderId]
  );

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.status !== 'pending_design') {
    return res.status(400).json({ error: 'Order is not pending design review' });
  }

  await db.run(
    `UPDATE "Order" SET status = 'design_approved', designer_id = ?, designer_reviewed_at = datetime('now')
     WHERE order_id = ?`,
    [userId, orderId]
  );

  res.json({ message: 'Design approved' });
});

// Designer rejects design
router.post('/:orderId/reject-design', requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const orderId = req.params.orderId;
  const { reason } = req.body;

  if (!(await isDesigner(userId))) {
    return res.status(403).json({ error: 'Designer access required' });
  }

  const order = await db.get<{ status: string }>(
    `SELECT status FROM "Order" WHERE order_id = ?`,
    [orderId]
  );

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.status !== 'pending_design') {
    return res.status(400).json({ error: 'Order is not pending design review' });
  }

  await db.run(
    `UPDATE "Order" SET status = 'design_rejected', designer_id = ?, designer_reviewed_at = datetime('now'), rejection_reason = ?
     WHERE order_id = ?`,
    [userId, reason || null, orderId]
  );

  res.json({ message: 'Design rejected' });
});

// Customer pays for order
router.post('/:orderId/pay', requireAuth, async (req, res) => {
  const customerId = req.session.userId!;
  const orderId = req.params.orderId;
  const { paymentMethod } = req.body;

  const order = await db.get<{ status: string; customer_id: number }>(
    `SELECT status, customer_id FROM "Order" WHERE order_id = ?`,
    [orderId]
  );

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.customer_id !== customerId) {
    return res.status(403).json({ error: 'Not your order' });
  }

  if (order.status !== 'design_approved') {
    return res.status(400).json({ error: 'Order is not ready for payment' });
  }

  await db.run(
    `UPDATE "Order" SET status = 'paid', payment_method = ?, paid_at = datetime('now')
     WHERE order_id = ?`,
    [paymentMethod || 'card', orderId]
  );

  res.json({ message: 'Payment successful' });
});

// Get paid orders for management to ship
router.get('/pending-shipment', requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  if (!(await isManagement(userId))) {
    return res.status(403).json({ error: 'Management access required' });
  }

  const orders = await db.all(
    `SELECT o.*, oi.*, p.name as product_name, p.picture_url, u.username as customer_name
     FROM "Order" o
     JOIN OrderItem oi ON o.order_id = oi.order_id
     JOIN Product p ON oi.product_id = p.product_id
     JOIN User u ON o.customer_id = u.user_id
     WHERE o.status = 'paid'
     ORDER BY o.paid_at ASC`,
    []
  );

  res.json(orders);
});

// Management ships order
router.post('/:orderId/ship', requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const orderId = req.params.orderId;

  if (!(await isManagement(userId))) {
    return res.status(403).json({ error: 'Management access required' });
  }

  const order = await db.get<{ status: string }>(
    `SELECT status FROM "Order" WHERE order_id = ?`,
    [orderId]
  );

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.status !== 'paid') {
    return res.status(400).json({ error: 'Order is not ready for shipment' });
  }

  await db.run(
    `UPDATE "Order" SET status = 'shipped', shipped_at = datetime('now')
     WHERE order_id = ?`,
    [orderId]
  );

  res.json({ message: 'Order shipped' });
});

// Get all orders (for management)
router.get('/all', requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  if (!(await isManagement(userId))) {
    return res.status(403).json({ error: 'Management access required' });
  }

  const orders = await db.all(
    `SELECT o.*, oi.*, p.name as product_name, p.picture_url, u.username as customer_name,
            d.username as designer_name
     FROM "Order" o
     JOIN OrderItem oi ON o.order_id = oi.order_id
     JOIN Product p ON oi.product_id = p.product_id
     JOIN User u ON o.customer_id = u.user_id
     LEFT JOIN User d ON o.designer_id = d.user_id
     ORDER BY o.order_date DESC`,
    []
  );

  res.json(orders);
});

export default router;
