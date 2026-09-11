const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT b.*, d.id AS driver_id, u.full_name AS driver_name, r.code AS route_code, r.name AS route_name
       FROM buses b
       LEFT JOIN drivers d ON d.assigned_bus_id = b.id
       LEFT JOIN users u ON u.id = d.user_id
       LEFT JOIN routes r ON r.id = d.assigned_route_id
       ORDER BY b.number`
    );
    return res.json({ buses: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load buses' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT b.*, d.id AS driver_id, u.full_name AS driver_name, r.id AS route_id, r.code AS route_code, r.name AS route_name
       FROM buses b
       LEFT JOIN drivers d ON d.assigned_bus_id = b.id
       LEFT JOIN users u ON u.id = d.user_id
       LEFT JOIN routes r ON r.id = d.assigned_route_id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Bus not found' });
    const trips = await query(
      `SELECT t.*, r.code AS route_code, r.name AS route_name
       FROM trips t JOIN routes r ON r.id = t.route_id
       WHERE t.bus_id = $1
       ORDER BY t.created_at DESC LIMIT 10`,
      [req.params.id]
    );
    return res.json({ bus: rows[0], trips: trips.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load bus' });
  }
});

router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { number, capacity = 40, status = 'idle' } = req.body || {};
    if (!number) return res.status(400).json({ error: 'Bus number is required' });
    const { rows } = await query(
      `INSERT INTO buses (number, capacity, status) VALUES ($1, $2, $3)
       RETURNING *`,
      [number, capacity, status]
    );
    return res.status(201).json({ bus: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Bus number already exists' });
    console.error(err);
    return res.status(500).json({ error: 'Failed to create bus' });
  }
});

router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { number, capacity, status } = req.body || {};
    const { rows } = await query(
      `UPDATE buses
       SET number = COALESCE($1, number),
           capacity = COALESCE($2, capacity),
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [number || null, capacity || null, status || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Bus not found' });
    return res.json({ bus: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update bus' });
  }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await query('DELETE FROM buses WHERE id = $1', [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete bus' });
  }
});

module.exports = router;
