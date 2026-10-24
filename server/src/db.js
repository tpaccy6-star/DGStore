const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'dgstore.sqlite'));
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    username TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    old_price REAL,
    rating REAL NOT NULL DEFAULT 0,
    reviews INTEGER NOT NULL DEFAULT 0,
    image TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '',
    description TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS cart_items (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    PRIMARY KEY (user_id, product_id)
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'Processing',
    total REAL NOT NULL,
    tracking_number TEXT,
    delivery_address TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS order_items (
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (order_id, product_id)
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL DEFAULT 'new_order',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const owner = db.prepare('SELECT id FROM users WHERE email = ?').get('owner@dgstore.rw');
if (!owner) {
  const insertUser = db.prepare('INSERT INTO users (name, email, username, password_hash, role) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('D&G Owner', 'owner@dgstore.rw', 'owner', bcrypt.hashSync('Owner123!', 10), 'owner');
  insertUser.run('Aline Student', 'student@dgstore.rw', 'aline', bcrypt.hashSync('Student123!', 10), 'customer');
}

if (db.prepare('SELECT COUNT(*) AS count FROM products').get().count === 0) {
  const products = [
    ['Aero Runner', 'Shoes', 48500, 56000, 4.8, 124, 'https://images.unsplash.com/photo-1648818283312-0ef710ca1aae?auto=format&fit=crop&w=900&q=85', 'Sand', 'An everyday runner built for movement, with breathable panels and a lightweight cushioned sole.', 24],
    ['Imanzi Tote', 'Bags', 36000, null, 4.9, 86, 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=900&q=85', 'Caramel', 'A roomy, structured carryall with an easy-access interior and reinforced everyday handles.', 18],
    ['Studio Speaker', 'Tech', 72500, 82000, 4.7, 209, 'https://images.unsplash.com/photo-1664648578369-81fce1ad428c?auto=format&fit=crop&w=900&q=85', 'Onyx', 'Clear room-filling audio, tactile controls and up to 18 hours of wireless listening.', 12],
    ['Kivu Low', 'Shoes', 52000, null, 4.6, 72, 'https://images.unsplash.com/photo-1678784973095-7f225e9c9dea?auto=format&fit=crop&w=900&q=85', 'Walnut', 'A refined low-profile sneaker with a durable gum sole and soft padded interior.', 21],
    ['Neon Market Set', 'Fashion', 44500, null, 4.8, 64, 'https://images.unsplash.com/photo-1758178192200-aa46fa597e34?auto=format&fit=crop&w=900&q=85', 'Lime', 'A bold, limited-edition pairing designed to bring color and character to simple looks.', 15],
    ['City High Top', 'Shoes', 58000, null, 4.7, 118, 'https://images.unsplash.com/photo-1657526883095-a7a5c463b94e?auto=format&fit=crop&w=900&q=85', 'Ivory', 'A comfortable high-top silhouette designed for long city days and effortless styling.', 16]
  ];
  const insert = db.prepare('INSERT INTO products (name, category, price, old_price, rating, reviews, image, color, description, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const seed = db.transaction(() => products.forEach(product => insert.run(...product)));
  seed();
}

module.exports = db;
