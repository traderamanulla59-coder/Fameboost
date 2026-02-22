import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('admin_panel.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Admin',
    two_factor_enabled INTEGER DEFAULT 0,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    country TEXT,
    balance REAL DEFAULT 0,
    status TEXT DEFAULT 'Active',
    device_info TEXT,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    type TEXT NOT NULL,
    amount INTEGER,
    price REAL,
    status TEXT DEFAULT 'Completed',
    target TEXT,
    provider_order_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS subscription_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    duration TEXT NOT NULL, -- 'Monthly', 'Yearly'
    features TEXT,
    status TEXT DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    plan_id INTEGER,
    status TEXT DEFAULT 'Active',
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME,
    auto_renew INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(plan_id) REFERENCES subscription_plans(id)
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    key_value TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT DEFAULT 'Enabled',
    usage_limit INTEGER DEFAULT -1,
    current_usage INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_type TEXT, -- 'Admin', 'User'
    actor_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial admin if not exists (password: admin123)
const adminExists = db.prepare('SELECT id FROM admins LIMIT 1').get();
if (!adminExists) {
  db.prepare('INSERT INTO admins (email, password, role) VALUES (?, ?, ?)').run(
    'admin@fameflow.com',
    'admin123', // In real app, this would be hashed
    'Owner'
  );
}

// Seed initial settings
const settings = [
  ['maintenance_mode', 'false'],
  ['app_version', '1.0.0'],
  ['announcement', 'Welcome to the new FameFlow Admin Panel!'],
  ['feature_followers', 'true'],
  ['feature_views', 'true'],
  ['feature_likes', 'true']
];

const insertSetting = db.prepare('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)');
settings.forEach(s => insertSetting.run(s[0], s[1]));

export default db;
