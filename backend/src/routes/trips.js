const express = require('express');
const { query } = require('../db');
const { interpolatePath } = require('../utils/geo');
const { authenticate, requireRole } = require('../middleware/auth');
const tracking = require('../services/tracking');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const status = req.query.status;
    const params = [];
    let sql = `SELECT t.*, b.number AS bus_number, r.code AS route_code, r.name AS route_name,
                      u.full_name AS driver_name
               FROM trips t
               JOIN buses b ON b.id = t.bus_id
               JOIN routes r ON r.id = t.route_id
               JOIN drivers d ON d.id = t.driver_id
               JOIN users u ON u.id = d.user_id`;
    if (status) {
      params.push(status);
      sql += ` WHERE t.status = $1`;
    }
    sql += ' ORDER BY t.created_at DESC LIMIT 100';
    const { rows } = await query(sql, params);
    return res.json({ trips: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load trips' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.*, b.number AS bus_number, b.capacity, r.code AS route_code, r.name AS route_name, r.path,
              u.full_name AS driver_name
       FROM trips t
       JOIN buses b ON b.id = t.bus_id
       JOIN routes r ON r.id = t.route_id
       JOIN drivers d ON d.id = t.driver_id
       JOIN users u ON u.id = d.user_id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Trip not found' });
    const locs = await query(
      'SELECT * FROM bus_locations WHERE trip_id = $1 ORDER BY recorded_at DESC LIMIT 40',
      [req.params.id]
    );
    return res.json({ trip: rows[0], locations: locs.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load trip' });
  }
});

router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { busId, driverId, routeId } = req.body || {};
    if (!busId || !driverId || !routeId) {
      return res.status(400).json({ error: 'busId, driverId and routeId are required' });
    }
    const { rows } = await query(
      `INSERT INTO trips (bus_id, driver_id, route_id, status)
       VALUES ($1, $2, $3, 'scheduled') RETURNING *`,
      [busId, driverId, routeId]
    );
    return res.status(201).json({ trip: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create trip' });
  }
});

router.put('/:id', authenticate, requireRole('admin', 'driver'), async (req, res) => {
  try {
    const { status, delayMinutes, delayReason, occupancy } = req.body || {};
    if (req.user.role === 'driver') {
      const owned = await query(
        `SELECT t.id FROM trips t JOIN drivers d ON d.id = t.driver_id
         WHERE t.id = $1 AND d.user_id = $2`,
        [req.params.id, req.user.id]
      );
      if (!owned.rows[0]) return res.status(403).json({ error: 'Not your trip' });
    }
    const { rows } = await query(
      `UPDATE trips
       SET status = COALESCE($1, status),
           delay_minutes = COALESCE($2, delay_minutes),
           delay_reason = COALESCE($3, delay_reason),
           occupancy = COALESCE($4, occupancy),
           updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [status || null, delayMinutes ?? null, delayReason || null, occupancy ?? null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Trip not found' });
    tracking.emitTrip(rows[0]);
    return res.json({ trip: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update trip' });
  }
});

async function startTripForDriver(driverUserId, extras = {}) {
  const driverRes = await query(
    `SELECT d.*, b.id AS bus_id, r.id AS route_id, r.path
     FROM drivers d
     JOIN buses b ON b.id = d.assigned_bus_id
     JOIN routes r ON r.id = d.assigned_route_id
     WHERE d.user_id = $1`,
    [driverUserId]
  );
  const driver = driverRes.rows[0];
  if (!driver) throw Object.assign(new Error('No assigned bus/route'), { status: 400 });
  const existing = await query(
    `SELECT * FROM trips WHERE driver_id = $1 AND status IN ('active', 'delayed') ORDER BY started_at DESC LIMIT 1`,
    [driver.id]
  );
  if (existing.rows[0]) return existing.rows[0];
  const { rows } = await query(
    `INSERT INTO trips (bus_id, driver_id, route_id, status, occupancy, started_at, progress, current_stop_index)
     VALUES ($1, $2, $3, 'active', $4, NOW(), 0, 0) RETURNING *`,
    [driver.bus_id, driver.id, driver.route_id, extras.occupancy || 8]
  );
  await query(`UPDATE buses SET status = 'active', updated_at = NOW() WHERE id = $1`, [driver.bus_id]);
  await query(`UPDATE drivers SET status = 'on_trip', updated_at = NOW() WHERE id = $1`, [driver.id]);
  const path = Array.isArray(driver.path) ? driver.path : [];
  const start = interpolatePath(path, 0);
  await tracking.recordLocation({
    tripId: rows[0].id,
    lat: start.lat,
    lng: start.lng,
    speedKmh: 18,
    heading: start.heading,
    progress: 0,
    currentStopIndex: 0,
    occupancy: extras.occupancy || 8,
    source: 'simulation',
  });
  return rows[0];
}

module.exports = router;
module.exports.startTripForDriver = startTripForDriver;
