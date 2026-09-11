const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1 OR user_id IS NULL
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    return res.json({ notifications: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load notifications' });
  }
});

router.post('/:id/read', authenticate, async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)', [
      req.params.id,
      req.user.id,
    ]);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to mark read' });
  }
});

router.post('/announce', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { title, body, severity = 'info' } = req.body || {};
    if (!title || !body) return res.status(400).json({ error: 'Title and body required' });
    const ann = await query(
      `INSERT INTO announcements (title, body, severity, created_by) VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, body, severity, req.user.id]
    );
    await query(
      `INSERT INTO notifications (user_id, type, title, body)
       SELECT id, 'announcement', $1, $2 FROM users WHERE role = 'student'`,
      [title, body]
    );
    return res.status(201).json({ announcement: ann.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to announce' });
  }
});

router.get('/announcements', authenticate, async (_req, res) => {
  try {
    const { rows } = await query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20');
    return res.json({ announcements: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load announcements' });
  }
});

module.exports = router;
