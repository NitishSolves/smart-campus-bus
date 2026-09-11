const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { predictDemand } = require('../utils/demand');

const router = express.Router();

async function hydrateRoute(routeId) {
  const routeRes = await query('SELECT * FROM routes WHERE id = $1', [routeId]);
  const route = routeRes.rows[0];
  if (!route) return null;
  const stops = await query(
    `SELECT rs.stop_order, rs.dwell_seconds, s.*
     FROM route_stops rs JOIN stops s ON s.id = rs.stop_id
     WHERE rs.route_id = $1
     ORDER BY rs.stop_order`,
    [routeId]
  );
  const buses = await query(
    `SELECT b.* FROM buses b
     JOIN drivers d ON d.assigned_bus_id = b.id
     WHERE d.assigned_route_id = $1`,
    [routeId]
  );
  const trips = await query(
    `SELECT t.*, b.number AS bus_number
     FROM trips t JOIN buses b ON b.id = t.bus_id
     WHERE t.route_id = $1 AND t.status IN ('active', 'delayed')`,
    [routeId]
  );
  return { ...route, stops: stops.rows, buses: buses.rows, activeTrips: trips.rows };
}

router.get('/', authenticate, async (_req, res) => {
  try {
    const { rows } = await query('SELECT * FROM routes ORDER BY code');
    const routes = [];
    for (const route of rows) {
      routes.push(await hydrateRoute(route.id));
    }
    return res.json({ routes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load routes' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const route = await hydrateRoute(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    const now = new Date();
    const samples = await query(
      'SELECT hour_of_day, day_of_week, passenger_count FROM historical_demand WHERE route_id = $1',
      [route.id]
    );
    const demand = predictDemand({
      samples: samples.rows,
      hour: now.getHours(),
      day: now.getDay(),
      capacity: 40,
    });
    return res.json({ route, demand });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load route' });
  }
});

router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { code, name, startName, endName, durationMinutes = 18, path = [], stopIds = [] } = req.body || {};
    if (!code || !name || !startName || !endName) {
      return res.status(400).json({ error: 'Missing required route fields' });
    }
    const { rows } = await query(
      `INSERT INTO routes (code, name, start_name, end_name, duration_minutes, path)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [code, name, startName, endName, durationMinutes, JSON.stringify(path)]
    );
    const route = rows[0];
    for (let i = 0; i < stopIds.length; i += 1) {
      await query(
        'INSERT INTO route_stops (route_id, stop_id, stop_order) VALUES ($1, $2, $3)',
        [route.id, stopIds[i], i + 1]
      );
    }
    return res.status(201).json({ route: await hydrateRoute(route.id) });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Route code already exists' });
    console.error(err);
    return res.status(500).json({ error: 'Failed to create route' });
  }
});

router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { code, name, startName, endName, durationMinutes, status, path, stopIds } = req.body || {};
    const { rows } = await query(
      `UPDATE routes
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           start_name = COALESCE($3, start_name),
           end_name = COALESCE($4, end_name),
           duration_minutes = COALESCE($5, duration_minutes),
           status = COALESCE($6, status),
           path = COALESCE($7, path),
           updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [
        code || null,
        name || null,
        startName || null,
        endName || null,
        durationMinutes || null,
        status || null,
        path ? JSON.stringify(path) : null,
        req.params.id,
      ]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Route not found' });
    if (Array.isArray(stopIds)) {
      await query('DELETE FROM route_stops WHERE route_id = $1', [req.params.id]);
      for (let i = 0; i < stopIds.length; i += 1) {
        await query(
          'INSERT INTO route_stops (route_id, stop_id, stop_order) VALUES ($1, $2, $3)',
          [req.params.id, stopIds[i], i + 1]
        );
      }
    }
    return res.json({ route: await hydrateRoute(req.params.id) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update route' });
  }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await query('DELETE FROM routes WHERE id = $1', [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete route' });
  }
});

module.exports = router;
