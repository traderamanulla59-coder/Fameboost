import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import dotenv from 'dotenv';
import db from './src/db.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// --- Admin Authentication ---
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE email = ? AND password = ?').get(email, password);
  
  if (admin) {
    // In a real app, generate a JWT here
    res.json({ 
      success: true, 
      admin: { id: admin.id, email: admin.email, role: admin.role } 
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// --- Dashboard Stats ---
app.get('/api/admin/stats', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalRevenue = db.prepare('SELECT SUM(price) as total FROM orders').get().total || 0;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const activeSubs = db.prepare('SELECT COUNT(*) as count FROM user_subscriptions WHERE status = "Active"').get().count;
  
  // Growth data (simulated for chart)
  const growth = [
    { name: 'Mon', revenue: 4000, users: 240 },
    { name: 'Tue', revenue: 3000, users: 139 },
    { name: 'Wed', revenue: 2000, users: 980 },
    { name: 'Thu', revenue: 2780, users: 390 },
    { name: 'Fri', revenue: 1890, users: 480 },
    { name: 'Sat', revenue: 2390, users: 380 },
    { name: 'Sun', revenue: 3490, users: 430 },
  ];

  res.json({
    totalUsers,
    totalRevenue,
    totalOrders,
    activeSubs,
    growth
  });
});

// --- User Management ---
app.get('/api/admin/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

app.post('/api/admin/users/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// --- API Key Management ---
app.get('/api/admin/api-keys', (req, res) => {
  const keys = db.prepare('SELECT * FROM api_keys').all();
  res.json(keys);
});

app.post('/api/admin/api-keys', (req, res) => {
  const { name, key_value, provider } = req.body;
  db.prepare('INSERT INTO api_keys (name, key_value, provider) VALUES (?, ?, ?)').run(name, key_value, provider);
  res.json({ success: true });
});

// --- App Settings ---
app.get('/api/admin/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM app_settings').all();
  const settingsObj = settings.reduce((acc: any, s: any) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
  res.json(settingsObj);
});

app.post('/api/admin/settings', (req, res) => {
  const { key, value } = req.body;
  db.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run(value, key);
  res.json({ success: true });
});

// --- Order History ---
app.get('/api/orders', (req, res) => {
  const { userId } = req.query;
  let orders;
  if (userId) {
    orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  } else {
    orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  }
  res.json(orders);
});

app.post('/api/deposit', (req, res) => {
  const { userId, amount } = req.body;
  const orderId = 'DEP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  
  try {
    db.prepare('INSERT INTO orders (id, user_id, type, amount, price, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(orderId, userId || null, 'deposit', amount, amount, 'completed');
    
    res.json({ success: true, orderId });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Existing Order Logic (Updated to use DB) ---
app.post('/api/order', async (req, res) => {
  const { type, amount, username, link, userId } = req.body;
  const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const price = type === 'followers' ? amount * 0.75 : (type === 'views' ? amount * 0.10 : amount * 0.40);

  // SMM Panel API Integration
  const SMM_API_URL = process.env.SMM_PANEL_API_URL;
  const SMM_API_KEY = process.env.SMM_PANEL_API_KEY;
  
  try {
    // Record in DB
    db.prepare('INSERT INTO orders (id, user_id, type, amount, price, target) VALUES (?, ?, ?, ?, ?, ?)')
      .run(orderId, userId || null, type, amount, price, username || link);

    if (SMM_API_URL && SMM_API_KEY) {
      // Real API call would go here
    }

    res.json({ 
      success: true, 
      orderId,
      message: 'Order placed successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
