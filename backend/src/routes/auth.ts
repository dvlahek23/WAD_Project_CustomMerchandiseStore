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

  // Get the regular role ID by name (case-insensitive)
  const regularRole = await db.get<{ role_id: number }>(
    `SELECT role_id FROM Role WHERE LOWER(name) = 'regular'`
  );

  if (!regularRole) {
    return res.status(500).json({ error: 'Role configuration error' });
  }

  const result = await db.run(
    `INSERT INTO User (email, username, password_hash, role_id, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
    [email, username, hashed, regularRole.role_id]
  );

  // Get the customer type ID by name (case-insensitive)
  const customerType = await db.get<{ user_type_id: number }>(
    `SELECT user_type_id FROM RegularUserType WHERE LOWER(name) = 'customer'`
  );

  const userId = result.lastID;
  if (customerType) {
    await db.run(
      `INSERT INTO User_RegularUserType (user_id, user_type_id) VALUES (?, ?)`,
      [userId, customerType.user_type_id]
    );
  }

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

router.get('/check-username/:username', async (req, res) => {
  const { username } = req.params;

  const exists = await db.get(
    `SELECT user_id FROM User WHERE username = ?`,
    [username]
  );

  res.json({ available: !exists });
});

router.get('/check-email/:email', async (req, res) => {
  const { email } = req.params;

  const exists = await db.get(
    `SELECT user_id FROM User WHERE email = ?`,
    [email]
  );

  res.json({ available: !exists });
});

// Middleware to check if user is logged in
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Middleware to check if user is admin or management
const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Helper to log actions
async function logAction(actorUserId: number, entityType: string, entityId: number | null, action: string, oldValue?: string | null, newValue?: string | null) {
  await db.run(
    `INSERT INTO Log (actor_user_id, entity_type, entity_id, action, old_value, new_value, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [actorUserId, entityType, entityId, action, oldValue || null, newValue || null]
  );
}

// Request designer status (for customers)
router.post('/request-designer', requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  // Check if already a designer
  const designerType = await db.get<{ user_type_id: number }>(
    `SELECT user_type_id FROM RegularUserType WHERE LOWER(name) = 'designer'`
  );

  if (designerType) {
    const isDesigner = await db.get(
      `SELECT * FROM User_RegularUserType WHERE user_id = ? AND user_type_id = ?`,
      [userId, designerType.user_type_id]
    );

    if (isDesigner) {
      return res.status(400).json({ error: 'You are already a designer' });
    }
  }

  // Check if already has a pending request
  const pendingRequest = await db.get(
    `SELECT * FROM DesignerRequest WHERE user_id = ? AND status = 'pending'`,
    [userId]
  );

  if (pendingRequest) {
    return res.status(400).json({ error: 'You already have a pending request' });
  }

  // Create the request
  await db.run(
    `INSERT INTO DesignerRequest (user_id, status, created_at) VALUES (?, 'pending', datetime('now'))`,
    [userId]
  );

  await logAction(userId, 'designer_request', null, 'created', null, 'pending');

  res.json({ message: 'Designer request submitted' });
});

// Get user's own designer request status
router.get('/my-designer-request', requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  const request = await db.get(
    `SELECT * FROM DesignerRequest WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  res.json(request || null);
});

// Get pending designer requests (for management)
router.get('/designer-requests', requireAdmin, async (_req, res) => {
  const requests = await db.all(
    `SELECT dr.*, u.username, u.email
     FROM DesignerRequest dr
     JOIN User u ON dr.user_id = u.user_id
     WHERE dr.status = 'pending'
     ORDER BY dr.created_at ASC`
  );

  res.json(requests);
});

// Approve designer request (for management)
router.post('/designer-requests/:requestId/approve', requireAdmin, async (req, res) => {
  const requestId = req.params.requestId as string;
  const reviewerId = req.session.userId!;

  const request = await db.get<{ user_id: number; status: string }>(
    `SELECT * FROM DesignerRequest WHERE request_id = ?`,
    [requestId]
  );

  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Request already processed' });
  }

  // Get the requesting user's username for logging
  const targetUser = await db.get<{ username: string }>(
    `SELECT username FROM User WHERE user_id = ?`,
    [request.user_id]
  );

  // Update request status
  await db.run(
    `UPDATE DesignerRequest SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now') WHERE request_id = ?`,
    [reviewerId, requestId]
  );

  // Add designer type to user
  const designerType = await db.get<{ user_type_id: number }>(
    `SELECT user_type_id FROM RegularUserType WHERE LOWER(name) = 'designer'`
  );

  if (designerType) {
    await db.run(
      `INSERT OR IGNORE INTO User_RegularUserType (user_id, user_type_id) VALUES (?, ?)`,
      [request.user_id, designerType.user_type_id]
    );
  }

  await logAction(reviewerId, 'designer_request', request.user_id, 'approved', `${targetUser?.username}|pending`, 'approved');

  res.json({ message: 'Request approved' });
});

// Deny designer request (for management)
router.post('/designer-requests/:requestId/deny', requireAdmin, async (req, res) => {
  const requestId = req.params.requestId as string;
  const reviewerId = req.session.userId!;

  const request = await db.get<{ user_id: number; status: string }>(
    `SELECT * FROM DesignerRequest WHERE request_id = ?`,
    [requestId]
  );

  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Request already processed' });
  }

  // Get the requesting user's username for logging
  const targetUser = await db.get<{ username: string }>(
    `SELECT username FROM User WHERE user_id = ?`,
    [request.user_id]
  );

  // Update request status
  await db.run(
    `UPDATE DesignerRequest SET status = 'denied', reviewed_by = ?, reviewed_at = datetime('now') WHERE request_id = ?`,
    [reviewerId, requestId]
  );

  await logAction(reviewerId, 'designer_request', request.user_id, 'denied', `${targetUser?.username}|pending`, 'denied');

  res.json({ message: 'Request denied' });
});

// Get all users (admin only)
router.get('/users', requireAdmin, async (_req, res) => {
  const users = await db.all<User & { role_name: string }>(
    `SELECT u.user_id, u.email, u.username, u.role_id, r.name as role_name, u.created_at
     FROM User u
     JOIN Role r ON u.role_id = r.role_id
     ORDER BY u.created_at DESC`
  );

  // Get user types for each user
  const usersWithTypes = await Promise.all(users.map(async (user) => {
    const types = await db.all<{ name: string }>(
      `SELECT rt.name FROM User_RegularUserType urt
       JOIN RegularUserType rt ON urt.user_type_id = rt.user_type_id
       WHERE urt.user_id = ?`,
      [user.user_id]
    );
    return {
      ...user,
      userTypes: types.map(t => t.name)
    };
  }));

  res.json(usersWithTypes);
});

// Update user role (admin only)
router.put('/users/:userId/role', requireAdmin, async (req, res) => {
  const userId = req.params.userId as string;
  const { roleId } = req.body;
  const actorId = req.session.userId!;

  if (!roleId || ![1, 2, 3, 4].includes(roleId)) {
    return res.status(400).json({ error: 'Invalid role ID' });
  }

  // Get target user info for logging
  const targetUser = await db.get<{ username: string, role_id: number }>(
    `SELECT username, role_id FROM User WHERE user_id = ?`,
    [userId]
  );

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const oldRoleName = await db.get<{ name: string }>(
    `SELECT name FROM Role WHERE role_id = ?`,
    [targetUser.role_id]
  );

  const newRoleName = await db.get<{ name: string }>(
    `SELECT name FROM Role WHERE role_id = ?`,
    [roleId]
  );

  await db.run(
    `UPDATE User SET role_id = ? WHERE user_id = ?`,
    [roleId, userId]
  );

  // Log with target username included in old_value as "username|old_role"
  await logAction(actorId, 'user_role', parseInt(userId), 'updated', `${targetUser.username}|${oldRoleName?.name}`, newRoleName?.name);

  res.json({ message: 'Role updated' });
});

// Add user type (admin only)
router.post('/users/:userId/types', requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const { userTypeId } = req.body;

  if (!userTypeId || ![1, 2].includes(userTypeId)) {
    return res.status(400).json({ error: 'Invalid user type ID' });
  }

  // Check if already has this type
  const exists = await db.get(
    `SELECT * FROM User_RegularUserType WHERE user_id = ? AND user_type_id = ?`,
    [userId, userTypeId]
  );

  if (exists) {
    return res.status(400).json({ error: 'User already has this type' });
  }

  await db.run(
    `INSERT INTO User_RegularUserType (user_id, user_type_id) VALUES (?, ?)`,
    [userId, userTypeId]
  );

  res.json({ message: 'User type added' });
});

// Remove user type (admin only)
router.delete('/users/:userId/types/:typeId', requireAdmin, async (req, res) => {
  const { userId, typeId } = req.params;

  await db.run(
    `DELETE FROM User_RegularUserType WHERE user_id = ? AND user_type_id = ?`,
    [userId, typeId]
  );

  res.json({ message: 'User type removed' });
});

// Delete user (admin only)
router.delete('/users/:userId', requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.userId as string);
  const actorId = req.session.userId!;

  // Cannot delete yourself
  if (userId === actorId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  // Check if user exists
  const user = await db.get<{ username: string }>(
    `SELECT username FROM User WHERE user_id = ?`,
    [userId]
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    // Delete related records first (foreign key constraints)
    await db.run(`DELETE FROM User_RegularUserType WHERE user_id = ?`, [userId]);
    await db.run(`UPDATE DesignerRequest SET reviewed_by = NULL WHERE reviewed_by = ?`, [userId]);
    await db.run(`DELETE FROM DesignerRequest WHERE user_id = ?`, [userId]);
    await db.run(`DELETE FROM Log WHERE actor_user_id = ?`, [userId]);
    await db.run(`DELETE FROM Review WHERE customer_id = ?`, [userId]);
    await db.run(`DELETE FROM OrderItem WHERE order_id IN (SELECT order_id FROM "Order" WHERE customer_id = ?)`, [userId]);
    await db.run(`DELETE FROM "Order" WHERE customer_id = ?`, [userId]);
    await db.run(`DELETE FROM CustomDesign WHERE customer_id = ?`, [userId]);
    await db.run(`DELETE FROM DesignTemplate WHERE designer_id = ?`, [userId]);
    await db.run(`UPDATE Category SET manager_id = ? WHERE manager_id = ?`, [actorId, userId]);

    // Delete the user
    await db.run(`DELETE FROM User WHERE user_id = ?`, [userId]);

    // Log the action (store username since user is now deleted)
    await logAction(actorId, 'user', userId, 'deleted', user.username, null);

    res.json({ message: 'User deleted successfully' });
  } catch (err: any) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: `Failed to delete user: ${err.message || 'Unknown error'}` });
  }
});

// Middleware for admin only (not management)
const requireAdminOnly = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await db.get<{ role_name: string }>(
    `SELECT r.name as role_name FROM User u
     JOIN Role r ON u.role_id = r.role_id
     WHERE u.user_id = ?`,
    [req.session.userId]
  );

  if (!user || user.role_name.toLowerCase() !== 'administrator') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all logs (admin only)
router.get('/logs', requireAdminOnly, async (_req, res) => {
  const logs = await db.all(
    `SELECT l.*, u.username as actor_username, t.username as entity_username
     FROM Log l
     JOIN User u ON l.actor_user_id = u.user_id
     LEFT JOIN User t ON l.entity_id = t.user_id
     ORDER BY l.created_at DESC
     LIMIT 100`
  );

  // Parse old_value to extract target_username
  const parsedLogs = logs.map((log: any) => {
    // New format: old_value contains "username|old_value"
    if ((log.entity_type === 'user_role' || log.entity_type === 'designer_request') && log.old_value && log.old_value.includes('|')) {
      const [targetUsername, oldVal] = log.old_value.split('|');
      return { ...log, target_username: targetUsername, old_value: oldVal };
    }
    // Old format: use entity_username from join
    if ((log.entity_type === 'user_role' || log.entity_type === 'designer_request') && log.entity_username) {
      return { ...log, target_username: log.entity_username };
    }
    // Deleted user: old_value contains the username
    if (log.entity_type === 'user' && log.action === 'deleted') {
      return { ...log, target_username: log.old_value, old_value: null };
    }
    // Other entity types with a target user
    if (log.entity_username) {
      return { ...log, target_username: log.entity_username };
    }
    return log;
  });

  res.json(parsedLogs);
});

router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(200).json(null);
  }

  const user = await db.get<User & { role_name: string }>(
    `SELECT u.user_id, u.email, u.username, u.role_id, r.name as role_name
     FROM User u
     JOIN Role r ON u.role_id = r.role_id
     WHERE u.user_id = ?`,
    [req.session.userId]
  );

  if (!user) {
    return res.status(200).json(null);
  }

  // Get user types for regular users
  const userTypes = await db.all<{ name: string }>(
    `SELECT rt.name
     FROM User_RegularUserType urt
     JOIN RegularUserType rt ON urt.user_type_id = rt.user_type_id
     WHERE urt.user_id = ?`,
    [req.session.userId]
  );

  res.json({
    user_id: user.user_id,
    email: user.email,
    username: user.username,
    role: user.role_name,
    userTypes: userTypes.map(t => t.name),
  });
});

export default router;

