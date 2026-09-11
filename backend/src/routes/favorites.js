const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    const hydrated = [];
    for (const fav of rows) {
      let target = null;
      if (fav.target_type === 'route') {
        const r = await query('SELECT id, code, name, start_name, end_name FROM routes WHERE id = $1', [fav.target_id]);
        target = r.rows[0];
      } else if (fav.target_type === 'stop') {
        const s = await query('SELECT id, name, lat, lng FROM stops WHERE id = $1', [fav.target_id]);
        target = s.rows[0];
      } else if (fav.target_type === 'bus') {
        const b = await query('SELECT id, number, status FROM buses WHERE id = $1', [fav.target_id]);
        target = b.rows[0];
      }
      hydrated.push({ ...fav, target });
    }
    return res.json({ favorites: hydrated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load favorites' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { targetType, targetId } = req.body || {};
    if (!['route', 'stop', 'bus'].includes(targetType) || !targetId) {
      return res.status(400).json({ error: 'Valid targetType and targetId required' });
    }
    const { rows } = await query(
      `INSERT INTO favorites (user_id, target_type, target_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, target_type, target_id) DO NOTHING
       RETURNING *`,
      [req.user.id, targetType, targetId]
    );
    return res.status(201).json({ favorite: rows[0] || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to save favorite' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await query('DELETE FROM favorites WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

module.exports = router;
