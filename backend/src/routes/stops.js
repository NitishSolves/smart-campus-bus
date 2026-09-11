const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { computeStopEta } = require('../utils/eta');
const { crowdLevel } = require('../utils/geo');

const router = express.Router();

router.get('/', authenticate, async (_req, res) => {
  try {
    const { rows } = await query('SELECT * FROM stops ORDER BY name');
    return res.json({ stops: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load stops' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const stopRes = await query('SELECT * FROM stops WHERE id = $1', [req.params.id]);
    if (!stopRes.rows[0]) return res.status(404).json({ error: 'Stop not found' });
    const stop = stopRes.rows[0];
    const routes = await query(
      `SELECT r.*, rs.stop_order
       FROM route_stops rs JOIN routes r ON r.id = rs.route_id
       WHERE rs.stop_id = $1
       ORDER BY r.code`,
      [stop.id]
    );
    const trips = await query(
      `SELECT t.*, b.number AS bus_number, b.capacity, r.code AS route_code, r.name AS route_name, r.path,
              loc.lat, loc.lng, loc.speed_kmh, loc.recorded_at
       FROM trips t
       JOIN buses b ON b.id = t.bus_id
       JOIN routes r ON r.id = t.route_id
       JOIN route_stops rs ON rs.route_id = r.id AND rs.stop_id = $1
       LEFT JOIN LATERAL (
         SELECT lat, lng, speed_kmh, recorded_at
         FROM bus_locations
         WHERE trip_id = t.id
         ORDER BY recorded_at DESC LIMIT 1
       ) loc ON TRUE
       WHERE t.status IN ('active', 'delayed')`,
      [stop.id]
    );
    const upcoming = trips.rows.map((trip) => {
      const path = Array.isArray(trip.path) ? trip.path : [];
      const point = {
        lat: Number(trip.lat || path[0]?.lat || stop.lat),
        lng: Number(trip.lng || path[0]?.lng || stop.lng),
      };
      const eta = computeStopEta({
        point,
        path,
        stop: { lat: Number(stop.lat), lng: Number(stop.lng) },
        speedKmh: Number(trip.speed_kmh || 18),
        delayMinutes: Number(trip.delay_minutes || 0),
      });
      return {
        tripId: trip.id,
        busNumber: trip.bus_number,
        routeCode: trip.route_code,
        routeName: trip.route_name,
        status: trip.status,
        occupancy: trip.occupancy,
        crowd: crowdLevel(trip.occupancy, trip.capacity),
        etaMinutes: eta.etaMinutes,
        remainingDistanceM: eta.remainingDistanceM,
      };
    }).sort((a, b) => a.etaMinutes - b.etaMinutes);
    return res.json({ stop, routes: routes.rows, upcoming });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load stop' });
  }
});

router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, lat, lng, description } = req.body || {};
    if (!name || lat == null || lng == null) {
      return res.status(400).json({ error: 'Name, lat and lng are required' });
    }
    const { rows } = await query(
      'INSERT INTO stops (name, lat, lng, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, lat, lng, description || null]
    );
    return res.status(201).json({ stop: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Stop already exists' });
    console.error(err);
    return res.status(500).json({ error: 'Failed to create stop' });
  }
});

router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, lat, lng, description } = req.body || {};
    const { rows } = await query(
      `UPDATE stops
       SET name = COALESCE($1, name),
           lat = COALESCE($2, lat),
           lng = COALESCE($3, lng),
           description = COALESCE($4, description),
           updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name || null, lat ?? null, lng ?? null, description || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Stop not found' });
    return res.json({ stop: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update stop' });
  }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await query('DELETE FROM stops WHERE id = $1', [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete stop' });
  }
});

module.exports = router;
