const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { signToken, authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, role = 'student', phone } = req.body || {};
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password and full name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const allowed = ['student'];
    const assignedRole = allowed.includes(role) ? role : 'student';
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, full_name, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role, phone, default_stop_id`,
      [email.toLowerCase(), hash, fullName, assignedRole, phone || null]
    );
    const user = rows[0];
    return res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const { rows } = await query(
      'SELECT id, email, password_hash, full_name, role, phone, default_stop_id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    delete user.password_hash;
    return res.json({ token: signToken(user), user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  return res.json({ user: req.user });
});

router.put('/me', authenticate, async (req, res) => {
  try {
    const { fullName, phone, defaultStopId } = req.body || {};
    const { rows } = await query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           default_stop_id = COALESCE($3, default_stop_id),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, full_name, role, phone, default_stop_id`,
      [fullName || null, phone || null, defaultStopId || null, req.user.id]
    );
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;
