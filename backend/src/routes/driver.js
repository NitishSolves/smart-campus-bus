const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const tracking = require('../services/tracking');
const { startTripForDriver } = require('./trips');
const { interpolatePath } = require('../utils/geo');
const { computeStopEta } = require('../utils/eta');

const router = express.Router();

async function getDriverRecord(userId) {
  const { rows } = await query(
    `SELECT d.*, b.number AS bus_number, b.capacity, b.status AS bus_status,
            r.code AS route_code, r.name AS route_name, r.start_name, r.end_name, r.path, r.duration_minutes
     FROM drivers d
     LEFT JOIN buses b ON b.id = d.assigned_bus_id
     LEFT JOIN routes r ON r.id = d.assigned_route_id
     WHERE d.user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

function noDriverProfile(res) {
  return res.status(400).json({ error: 'No driver profile is associated with this account' });
}

router.get('/me', authenticate, requireRole('driver', 'admin'), async (req, res) => {
  try {
    const driver = await getDriverRecord(req.user.id);
    if (!driver) return res.status(404).json({ error: 'Driver profile not found' });
    const tripRes = await query(
      `SELECT * FROM trips WHERE driver_id = $1 AND status IN ('active', 'delayed') ORDER BY started_at DESC LIMIT 1`,
      [driver.id]
    );
    const trip = tripRes.rows[0] || null;
    let nextStop = null;
    let etaMinutes = null;
    if (trip && driver.assigned_route_id) {
      const stops = await query(
        `SELECT s.*, rs.stop_order FROM route_stops rs JOIN stops s ON s.id = rs.stop_id
         WHERE rs.route_id = $1 ORDER BY rs.stop_order`,
        [driver.assigned_route_id]
      );
      const idx = Math.min((trip.current_stop_index || 0) + 1, Math.max(stops.rows.length - 1, 0));
      nextStop = stops.rows[idx] || null;
      const loc = await query(
        'SELECT lat, lng, speed_kmh FROM bus_locations WHERE trip_id = $1 ORDER BY recorded_at DESC LIMIT 1',
        [trip.id]
      );
      const path = Array.isArray(driver.path) ? driver.path : [];
      const point = loc.rows[0]
        ? { lat: Number(loc.rows[0].lat), lng: Number(loc.rows[0].lng) }
        : null;
      if (nextStop) {
        etaMinutes = computeStopEta({
          point,
          path,
          stop: { lat: Number(nextStop.lat), lng: Number(nextStop.lng) },
          speedKmh: Number(loc.rows[0]?.speed_kmh ?? 0),
          delayMinutes: Number(trip.delay_minutes || 0),
          lastLocationTime: loc.rows[0]?.recorded_at,
          tripStatus: trip.status,
        }).etaMinutes;
      }
    }
    return res.json({ driver, trip, nextStop, etaMinutes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load driver dashboard' });
  }
});

router.post('/trip/start', authenticate, requireRole('driver', 'admin'), async (req, res) => {
  try {
    const trip = await startTripForDriver(req.user.id);
    tracking.emitTrip(trip);
    return res.json({ trip });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to start trip' });
  }
});

router.post('/trip/location', authenticate, requireRole('driver', 'admin'), async (req, res) => {
  try {
    const { lat, lng, speedKmh, useSimulation = true } = req.body || {};
    const driver = await getDriverRecord(req.user.id);
    if (!driver) return noDriverProfile(res);
    const tripRes = await query(
      `SELECT * FROM trips WHERE driver_id = $1 AND status IN ('active', 'delayed') ORDER BY started_at DESC LIMIT 1`,
      [driver.id]
    );
    const trip = tripRes.rows[0];
    if (!trip) return res.status(400).json({ error: 'No active trip' });

    let finalLat = lat;
    let finalLng = lng;
    let finalSpeed = speedKmh || 18;
    let nextProgress = trip.progress || 0;
    let mode = 'SIMULATED';

    // If real GPS provided, use it; otherwise simulate
    const hasLiveCoords = lat !== undefined && lat !== null && lng !== undefined && lng !== null;
    if (hasLiveCoords) {
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: 'Invalid coordinates' });
      }
      finalLat = Number(lat);
      finalLng = Number(lng);
      mode = 'LIVE';
    } else if (useSimulation) {
      const path = Array.isArray(driver.path) ? driver.path : [];
      nextProgress = Math.min(0.99, Number(trip.progress || 0) + 0.04);
      const point = interpolatePath(path, nextProgress);
      finalLat = point.lat;
      finalLng = point.lng;
      mode = 'SIMULATED';
    } else {
      return res.status(400).json({ error: 'Either provide real coordinates or enable simulation' });
    }

    if (!Number.isFinite(Number(finalLat)) || !Number.isFinite(Number(finalLng))) {
      return res.status(400).json({ error: 'Coordinates must be finite numbers' });
    }

    const record = await tracking.recordLocation({
      tripId: trip.id,
      lat: finalLat,
      lng: finalLng,
      speedKmh: finalSpeed,
      heading: undefined,
      progress: nextProgress,
      occupancy: trip.occupancy,
      source: mode === 'LIVE' ? 'device' : 'simulation',
    });
    return res.json({ location: record, progress: nextProgress, mode });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update location' });
  }
});

router.post('/trip/occupancy', authenticate, requireRole('driver', 'admin'), async (req, res) => {
  try {
    const { passengerCount } = req.body || {};
    if (passengerCount === undefined || passengerCount === null) {
      return res.status(400).json({ error: 'passengerCount is required' });
    }
    const driver = await getDriverRecord(req.user.id);
    if (!driver) return res.status(404).json({ error: 'Driver profile not found' });
    
    // Validate occupancy doesn't exceed capacity
    if (passengerCount < 0) {
      return res.status(400).json({ error: 'Passenger count cannot be negative' });
    }
    if (passengerCount > driver.capacity) {
      return res.status(400).json({ error: `Passenger count exceeds bus capacity (${driver.capacity})` });
    }

    const tripRes = await query(
      `SELECT * FROM trips WHERE driver_id = $1 AND status IN ('active', 'delayed') ORDER BY started_at DESC LIMIT 1`,
      [driver.id]
    );
    const trip = tripRes.rows[0];
    if (!trip) return res.status(400).json({ error: 'No active trip' });

    const { rows } = await query(
      `UPDATE trips SET occupancy = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [passengerCount, trip.id]
    );
    tracking.lockOccupancy(trip.id);
    tracking.emitTrip(rows[0]);
    tracking.emitTracking({ buses: await tracking.getActiveTracking(), changedTripId: trip.id });
    return res.json({ trip: rows[0], message: `Occupancy updated to ${passengerCount}/${driver.capacity}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update occupancy' });
  }
});

router.post('/trip/delay', authenticate, requireRole('driver', 'admin'), async (req, res) => {
  try {
    const { minutes = 5, reason = 'Traffic delay' } = req.body || {};
    const driver = await getDriverRecord(req.user.id);
    if (!driver) return noDriverProfile(res);
    const { rows } = await query(
      `UPDATE trips SET status = 'delayed', delay_minutes = delay_minutes + $1, delay_reason = $2, updated_at = NOW()
       WHERE driver_id = $3 AND status IN ('active', 'delayed')
       RETURNING *`,
      [minutes, reason, driver.id]
    );
    if (!rows[0]) return res.status(400).json({ error: 'No active trip' });
    await query(
      `INSERT INTO notifications (user_id, type, title, body, related_route_id)
       SELECT id, 'delay', $1, $2, $3 FROM users WHERE role = 'student'`,
      [`${driver.bus_number} delayed`, `${driver.route_name} is delayed by ${minutes} min. ${reason}`, driver.assigned_route_id]
    );
    tracking.emitTrip(rows[0]);
    tracking.emitNotification({ type: 'delay', title: `${driver.bus_number} delayed` });
    return res.json({ trip: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to report delay' });
  }
});

router.post('/trip/end', authenticate, requireRole('driver', 'admin'), async (req, res) => {
  try {
    const driver = await getDriverRecord(req.user.id);
    if (!driver) return noDriverProfile(res);
    const tripRes = await query(
      `SELECT * FROM trips WHERE driver_id = $1 AND status IN ('active', 'delayed') ORDER BY started_at DESC LIMIT 1`,
      [driver.id]
    );
    if (!tripRes.rows[0]) return res.status(400).json({ error: 'No active trip' });
    await tracking.completeTrip(tripRes.rows[0].id);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to end trip' });
  }
});

router.post('/emergency', authenticate, requireRole('driver', 'admin'), async (req, res) => {
  try {
    const { message, lat, lng } = req.body || {};
    const driver = await getDriverRecord(req.user.id);
    if (!driver) return res.status(404).json({ error: 'Driver profile not found' });
    
    const tripRes = await query(
      `SELECT * FROM trips WHERE driver_id = $1 AND status IN ('active', 'delayed') ORDER BY started_at DESC LIMIT 1`,
      [driver.id]
    );
    const trip = tripRes.rows[0];
    if (!trip) return res.status(400).json({ error: 'No active trip' });

    const { rows } = await query(
      `INSERT INTO emergency_alerts (trip_id, bus_id, driver_id, lat, lng, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING *`,
      [trip.id, driver.assigned_bus_id, driver.id, lat || null, lng || null, message || 'Emergency alert from driver']
    );

    const alert = rows[0];
    tracking.emitEmergency(alert);
    
    // Notify admin
    await query(
      `INSERT INTO notifications (user_id, type, title, body, related_bus_id)
       SELECT id, 'emergency', $1, $2, $3 FROM users WHERE role = 'admin'`,
      [`Emergency: ${driver.bus_number}`, `Driver ${driver.full_name} triggered emergency on ${driver.route_name}`, driver.assigned_bus_id]
    );

    return res.status(201).json({ alert });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create emergency alert' });
  }
});

router.get('/history', authenticate, requireRole('driver', 'admin'), async (req, res) => {
  try {
    const driver = await getDriverRecord(req.user.id);
    if (!driver) return noDriverProfile(res);
    const { rows } = await query(
      `SELECT t.*, r.code AS route_code, r.name AS route_name, b.number AS bus_number
       FROM trips t
       JOIN routes r ON r.id = t.route_id
       JOIN buses b ON b.id = t.bus_id
       WHERE t.driver_id = $1
       ORDER BY t.created_at DESC LIMIT 30`,
      [driver.id]
    );
    return res.json({ trips: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load history' });
  }
});

module.exports = router;
