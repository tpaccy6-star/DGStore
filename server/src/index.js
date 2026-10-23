const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const port = Number(process.env.PORT || 3001);
const jwtSecret = process.env.JWT_SECRET || 'dgstore-development-secret';
app.use(cors());
app.use(express.json());

const productSelect = `SELECT id, name, category, price, old_price AS oldPrice, rating, reviews, image, color, description, stock, is_active AS isActive, created_at AS createdAt FROM products`;
const publicProduct = row => ({ ...row, isActive: Boolean(row.isActive) });
function tokenFor(user) { return jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '7d' }); }
function userFromRequest(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try { return jwt.verify(header.slice(7), jwtSecret); } catch { return null; }
}
function auth(req, res, next) { const user = userFromRequest(req); if (!user) return res.status(401).json({ message: 'Authentication required' }); req.user = user; next(); }
function ownerOnly(req, res, next) { if (req.user.role !== 'owner') return res.status(403).json({ message: 'Owner access required' }); next(); }
function cartForUser(userId) {
  return db.prepare(`SELECT p.id, p.name, p.category, p.price, p.old_price AS oldPrice, p.rating, p.reviews, p.image, p.color, p.description, p.stock, p.is_active AS isActive, p.created_at AS createdAt, c.quantity FROM products p JOIN cart_items c ON c.product_id = p.id WHERE c.user_id = ? AND p.is_active = 1`).all(userId).map(item => ({ ...publicProduct(item), productId: item.id, quantity: item.quantity }));
}

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/products', (req, res) => {
  const search = String(req.query.search || '').trim();
  const category = String(req.query.category || '').trim();
  const minPrice = Number(req.query.minPrice);
  const maxPrice = Number(req.query.maxPrice);
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 100);
  const params = [];
  let query = `${productSelect} WHERE is_active = 1`;
  if (search) { query += ' AND (LOWER(name) LIKE LOWER(?) OR LOWER(category) LIKE LOWER(?))'; params.push(`%${search}%`, `%${search}%`); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (Number.isFinite(minPrice)) { query += ' AND price >= ?'; params.push(minPrice); }
  if (Number.isFinite(maxPrice)) { query += ' AND price <= ?'; params.push(maxPrice); }
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  res.json(db.prepare(query).all(...params).map(publicProduct));
});

app.post('/auth/register', (req, res) => {
  const { name, email, password, username } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  try {
    const result = db.prepare('INSERT INTO users (name, email, username, password_hash) VALUES (?, ?, ?, ?)').run(name.trim(), email.trim().toLowerCase(), username?.trim() || null, bcrypt.hashSync(password, 10));
    const user = db.prepare('SELECT id, name, email, username, role FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ token: tokenFor(user), user });
  } catch (error) { res.status(409).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Email or username already exists' : 'Unable to create account' }); }
});
app.post('/auth/login', (req, res) => {
  const { email, username, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(email?.toLowerCase(), username);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) return res.status(401).json({ message: 'Invalid credentials' });
  const safeUser = { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role };
  res.json({ token: tokenFor(safeUser), user: safeUser });
});

app.get('/cart', auth, (req, res) => res.json({ cart: Object.fromEntries(cartForUser(req.user.id).map(item => [item.productId, item.quantity])), items: cartForUser(req.user.id) }));
app.post('/cart', auth, (req, res) => {
  const input = req.body?.cart || {};
  const upsert = db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?) ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = excluded.quantity');
  const sync = db.transaction(() => {
    const activeProductIds = [];
    for (const [productId, quantity] of Object.entries(input)) {
      const pId = Number(productId);
      const qty = Number(quantity);
      if (pId > 0 && qty > 0) {
        upsert.run(req.user.id, pId, qty);
        activeProductIds.push(pId);
      }
    }
    if (activeProductIds.length > 0) {
      db.prepare(`DELETE FROM cart_items WHERE user_id = ? AND product_id NOT IN (${activeProductIds.map(() => '?').join(',')})`).run(req.user.id, ...activeProductIds);
    } else {
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    }
  });
  sync();
  const items = cartForUser(req.user.id);
  res.json({ cart: Object.fromEntries(items.map(item => [item.productId, item.quantity])), items });
});

app.post('/orders', auth, (req, res) => {
  const { items, deliveryAddress, paymentMethod, promoCode, paymentDetails } = req.body || {};
  if (!Array.isArray(items) || !items.length || !deliveryAddress || !['momo', 'airtel', 'card'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Complete checkout details are required' });
  }

  // Consolidate multiple items with the same product ID
  const itemMap = new Map();
  for (const item of items) {
    const pId = Number(item.productId);
    const qty = Number(item.quantity) || 0;
    if (pId > 0 && qty > 0) {
      itemMap.set(pId, (itemMap.get(pId) || 0) + qty);
    }
  }

  if (itemMap.size === 0) {
    return res.status(400).json({ message: 'Your order must contain at least one valid item' });
  }

  const getProduct = db.prepare('SELECT id, name, price, stock FROM products WHERE id = ? AND is_active = 1');
  const orderItems = [];
  for (const [productId, quantity] of itemMap.entries()) {
    const prod = getProduct.get(productId);
    if (!prod) {
      return res.status(400).json({ message: `Product #${productId} is no longer available` });
    }
    if (quantity > prod.stock) {
      return res.status(400).json({ message: `Insufficient stock for ${prod.name} (only ${prod.stock} left)` });
    }
    orderItems.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      stock: prod.stock,
      quantity,
    });
  }

  let total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const normalizedPromo = String(promoCode || '').trim().toUpperCase();
  let discountRate = 0;
  if (normalizedPromo === 'DG2026') discountRate = 0.20;
  else if (normalizedPromo === 'WELCOME10') discountRate = 0.10;
  else if (normalizedPromo === 'STUDENT') discountRate = 0.15;

  if (discountRate > 0) {
    total = Math.round(total * (1 - discountRate));
  }

  const id = `DG-${Date.now().toString(36).toUpperCase()}`;
  const recordedPaymentMethod = paymentDetails
    ? `${paymentMethod.toUpperCase()} (${String(paymentDetails).trim()})`
    : paymentMethod;

  const create = db.transaction(() => {
    db.prepare('INSERT INTO orders (id, user_id, total, tracking_number, delivery_address, payment_method) VALUES (?, ?, ?, ?, ?, ?)').run(id, req.user.id, total, `TRK-${crypto.randomBytes(3).toString('hex').toUpperCase()}`, deliveryAddress.trim(), recordedPaymentMethod);
    const insert = db.prepare('INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)');
    const update = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');
    orderItems.forEach(item => {
      insert.run(id, item.id, item.name, item.price, item.quantity);
      const res = update.run(item.quantity, item.id, item.quantity);
      if (res.changes === 0) {
        throw new Error(`Insufficient stock available for ${item.name}`);
      }
    });
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  });

  try {
    create();
    res.status(201).json(orderById(id, req.user.id));
  } catch (err) {
    res.status(400).json({ message: err.message || 'Could not complete order' });
  }
});
function orderById(id, userId) {
  const order = db.prepare('SELECT id, status, total, tracking_number AS trackingNumber, created_at AS createdAt, delivery_address AS deliveryAddress, payment_method AS paymentMethod FROM orders WHERE id = ? AND user_id = ?').get(id, userId);
  return { ...order, items: db.prepare('SELECT oi.product_id AS productId, oi.name, oi.price, oi.quantity, p.image FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?').all(id) };
}
app.get('/orders', auth, (req, res) => res.json(db.prepare('SELECT id FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id).map(order => orderById(order.id, req.user.id))));

app.get('/admin/stats', auth, ownerOnly, (_req, res) => {
  const stats = db.prepare(`SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS totalOrders, (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers FROM orders`).get();
  const byStatus = Object.fromEntries(db.prepare('SELECT status, COUNT(*) AS count FROM orders GROUP BY status').all().map(item => [item.status, item.count]));
  res.json({ ...stats, byStatus });
});
app.get('/admin/products', auth, ownerOnly, (_req, res) => res.json(db.prepare(`${productSelect} ORDER BY created_at DESC`).all().map(publicProduct)));
app.post('/admin/products', auth, ownerOnly, (req, res) => {
  const { name, category, price, image, stock, oldPrice, color, description } = req.body || {};
  if (!name || !category || !image || !Number.isFinite(Number(price)) || !Number.isInteger(Number(stock))) return res.status(400).json({ message: 'Valid product fields are required' });
  const result = db.prepare('INSERT INTO products (name, category, price, old_price, image, color, description, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(name.trim(), category.trim(), Number(price), oldPrice ? Number(oldPrice) : null, image.trim(), color || '', description || '', Number(stock));
  res.status(201).json(publicProduct(db.prepare(`${productSelect} WHERE id = ?`).get(result.lastInsertRowid)));
});
app.patch('/admin/products/:id', auth, ownerOnly, (req, res) => {
  const current = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));
  if (!current) return res.status(404).json({ message: 'Product not found' });
  const next = { name: req.body.name ?? current.name, category: req.body.category ?? current.category, price: req.body.price ?? current.price, oldPrice: req.body.oldPrice ?? current.old_price, image: req.body.image ?? current.image, color: req.body.color ?? current.color, description: req.body.description ?? current.description, stock: req.body.stock ?? current.stock };
  if (!next.name || !next.category || !next.image || !Number.isFinite(Number(next.price)) || !Number.isInteger(Number(next.stock)) || Number(next.stock) < 0) return res.status(400).json({ message: 'Valid product fields are required' });
  db.prepare('UPDATE products SET name = ?, category = ?, price = ?, old_price = ?, image = ?, color = ?, description = ?, stock = ? WHERE id = ?').run(String(next.name).trim(), String(next.category).trim(), Number(next.price), next.oldPrice ? Number(next.oldPrice) : null, String(next.image).trim(), next.color || '', next.description || '', Number(next.stock), current.id);
  res.json(publicProduct(db.prepare(`${productSelect} WHERE id = ?`).get(current.id)));
});
app.delete('/admin/products/:id', auth, ownerOnly, (req, res) => { db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(Number(req.params.id)); res.status(204).end(); });
app.get('/admin/customers', auth, ownerOnly, (_req, res) => res.json(db.prepare(`SELECT u.id, u.name, u.email, COUNT(o.id) AS ordersCount, COALESCE(SUM(o.total), 0) AS totalSpend, MAX(o.created_at) AS lastActiveAt, u.created_at AS createdAt FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.role = 'customer' GROUP BY u.id ORDER BY lastActiveAt DESC`).all()));

app.get('/admin/orders', auth, ownerOnly, (_req, res) => {
  const orders = db.prepare(`SELECT o.id, o.status, o.total, o.created_at AS createdAt, o.delivery_address AS deliveryAddress, o.payment_method AS paymentMethod, u.name AS customerName, u.email AS customerEmail FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC`).all();
  const getItems = db.prepare('SELECT oi.product_id AS productId, oi.name, oi.price, oi.quantity, p.image FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?');
  res.json(orders.map(order => ({ ...order, items: getItems.all(order.id) })));
});
app.patch('/admin/orders/:id/status', auth, ownerOnly, (req, res) => { if (!['Processing', 'Packed', 'In Transit', 'Delivered', 'Cancelled'].includes(req.body?.status)) return res.status(400).json({ message: 'Invalid order status' }); db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(req.body.status, req.params.id); res.status(204).end(); });

app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ message: 'Unexpected server error' }); });
if (require.main === module) app.listen(port, '0.0.0.0', () => console.log(`DGStore API listening on http://localhost:${port}`));

module.exports = app;
