const { query } = require('../db');
const { interpolatePath, nearestStopIndex, crowdLevel } = require('../utils/geo');
const { computeStopEta } = require('../utils/eta');
const { predictDemand } = require('../utils/demand');

let ioRef = null;

function setIo(io) {
  ioRef = io;
}

function emitTracking(payload) {
  if (ioRef) ioRef.emit('tracking:update', payload);
}

function emitTrip(trip) {
  if (ioRef) ioRef.emit('trip:update', trip);
}

function emitNotification(notification) {
  if (ioRef) ioRef.emit('notification:new', notification);
}

function emitEmergency(alert) {
  if (ioRef) ioRef.emit('emergency:alert', alert);
}

async function getActiveTracking() {
  const { rows } = await query(
    `SELECT t.*, b.number AS bus_number, b.capacity, b.status AS bus_status,
            r.code AS route_code, r.name AS route_name, r.path, r.start_name, r.end_name,
            d.id AS driver_row_id, u.full_name AS driver_name,
            loc.lat, loc.lng, loc.speed_kmh, loc.heading, loc.recorded_at
     FROM trips t
     JOIN buses b ON b.id = t.bus_id
     JOIN routes r ON r.id = t.route_id
     JOIN drivers d ON d.id = t.driver_id
     JOIN users u ON u.id = d.user_id
     LEFT JOIN LATERAL (
       SELECT lat, lng, speed_kmh, heading, recorded_at
       FROM bus_locations WHERE trip_id = t.id
       ORDER BY recorded_at DESC LIMIT 1
     ) loc ON TRUE
     WHERE t.status IN ('active', 'delayed')
     ORDER BY t.started_at`
  );

  const result = [];
  for (const trip of rows) {
    const stopsRes = await query(
      `SELECT s.*, rs.stop_order
       FROM route_stops rs JOIN stops s ON s.id = rs.stop_id
       WHERE rs.route_id = $1 ORDER BY rs.stop_order`,
      [trip.route_id]
    );
    const stops = stopsRes.rows;
    const path = Array.isArray(trip.path) ? trip.path : [];
    const point = {
      lat: Number(trip.lat ?? path[0]?.lat ?? 0),
      lng: Number(trip.lng ?? path[0]?.lng ?? 0),
    };
    const nextIdx = Math.min(trip.current_stop_index + 1, Math.max(stops.length - 1, 0));
    const nextStop = stops[nextIdx] || stops[stops.length - 1];
    let eta = { etaMinutes: 0, remainingDistanceM: 0 };
    if (nextStop) {
      eta = computeStopEta({
        point,
        path,
        stop: { lat: Number(nextStop.lat), lng: Number(nextStop.lng) },
        speedKmh: Number(trip.speed_kmh || 18),
        delayMinutes: Number(trip.delay_minutes || 0),
      });
    }
    const samples = await query(
      'SELECT hour_of_day, day_of_week, passenger_count FROM historical_demand WHERE route_id = $1',
      [trip.route_id]
    );
    const now = new Date();
    const demand = predictDemand({
      samples: samples.rows,
      hour: now.getHours(),
      day: now.getDay(),
      capacity: trip.capacity,
    });
    result.push({
      tripId: trip.id,
      busId: trip.bus_id,
      busNumber: trip.bus_number,
      capacity: trip.capacity,
      occupancy: trip.occupancy,
      crowd: crowdLevel(trip.occupancy, trip.capacity),
      status: trip.status,
      delayMinutes: trip.delay_minutes,
      routeId: trip.route_id,
      routeCode: trip.route_code,
      routeName: trip.route_name,
      startName: trip.start_name,
      endName: trip.end_name,
      path,
      stops,
      driverName: trip.driver_name,
      lat: point.lat,
      lng: point.lng,
      heading: Number(trip.heading || 0),
      speedKmh: Number(trip.speed_kmh || 18),
      progress: Number(trip.progress || 0),
      currentStopIndex: trip.current_stop_index,
      nextStop: nextStop ? { id: nextStop.id, name: nextStop.name, lat: nextStop.lat, lng: nextStop.lng } : null,
      etaMinutes: eta.etaMinutes,
      remainingDistanceM: eta.remainingDistanceM,
      lastUpdate: trip.recorded_at || trip.updated_at,
      demand,
      startedAt: trip.started_at,
    });
  }
  return result;
}

async function recordLocation({ tripId, lat, lng, speedKmh, heading, progress, currentStopIndex, occupancy }) {
  const tripRes = await query('SELECT * FROM trips WHERE id = $1', [tripId]);
  const trip = tripRes.rows[0];
  if (!trip) return null;
  await query(
    `INSERT INTO bus_locations (trip_id, bus_id, lat, lng, speed_kmh, heading)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [tripId, trip.bus_id, lat, lng, speedKmh || 18, heading || 0]
  );
  const { rows } = await query(
    `UPDATE trips
     SET progress = COALESCE($1, progress),
         current_stop_index = COALESCE($2, current_stop_index),
         occupancy = COALESCE($3, occupancy),
         updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [progress ?? null, currentStopIndex ?? null, occupancy ?? null, tripId]
  );
  const payload = (await getActiveTracking()).find((t) => t.tripId === tripId);
  emitTracking({ buses: await getActiveTracking(), changedTripId: tripId });
  return payload || rows[0];
}

async function simulateTick() {
  const { rows } = await query(
    `SELECT t.id, t.progress, t.current_stop_index, t.occupancy, t.status, t.delay_minutes,
            r.path, r.id AS route_id, b.capacity
     FROM trips t
     JOIN routes r ON r.id = t.route_id
     JOIN buses b ON b.id = t.bus_id
     WHERE t.status IN ('active', 'delayed')`
  );
  for (const trip of rows) {
    const path = Array.isArray(trip.path) ? trip.path : [];
    if (path.length < 2) continue;
    const increment = trip.status === 'delayed' ? 0.0012 : 0.0022;
    let progress = Number(trip.progress || 0) + increment;
    if (progress >= 1) {
      await completeTrip(trip.id, { autoRestart: true });
      continue;
    }
    const point = interpolatePath(path, progress);
    const stopsRes = await query(
      `SELECT s.lat, s.lng, rs.stop_order
       FROM route_stops rs JOIN stops s ON s.id = rs.stop_id
       WHERE rs.route_id = $1 ORDER BY rs.stop_order`,
      [trip.route_id]
    );
    const idx = nearestStopIndex(point, stopsRes.rows);
    const occupancyWave = Math.max(
      4,
      Math.min(
        trip.capacity - 2,
        Math.round(trip.capacity * (0.25 + 0.55 * Math.sin(progress * Math.PI)))
      )
    );
    await recordLocation({
      tripId: trip.id,
      lat: point.lat,
      lng: point.lng,
      speedKmh: trip.status === 'delayed' ? 7 : 9,
      heading: point.heading,
      progress,
      currentStopIndex: idx,
      occupancy: occupancyWave,
    });
  }
}

async function completeTrip(tripId, { autoRestart = false } = {}) {
  const tripRes = await query('SELECT * FROM trips WHERE id = $1', [tripId]);
  const trip = tripRes.rows[0];
  if (!trip) return;
  await query(
    `UPDATE trips SET status = 'completed', progress = 1, ended_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [tripId]
  );
  await query(`UPDATE buses SET status = 'idle', updated_at = NOW() WHERE id = $1`, [trip.bus_id]);
  await query(`UPDATE drivers SET status = 'on_duty', updated_at = NOW() WHERE id = $1`, [trip.driver_id]);
  emitTrip({ tripId, status: 'completed' });
  if (autoRestart) {
    const route = await query('SELECT path FROM routes WHERE id = $1', [trip.route_id]);
    const { rows } = await query(
      `INSERT INTO trips (bus_id, driver_id, route_id, status, occupancy, started_at, progress, current_stop_index)
       VALUES ($1, $2, $3, 'active', 10, NOW(), 0, 0) RETURNING *`,
      [trip.bus_id, trip.driver_id, trip.route_id]
    );
    await query(`UPDATE buses SET status = 'active', updated_at = NOW() WHERE id = $1`, [trip.bus_id]);
    await query(`UPDATE drivers SET status = 'on_trip', updated_at = NOW() WHERE id = $1`, [trip.driver_id]);
    const path = Array.isArray(route.rows[0]?.path) ? route.rows[0].path : [];
    const start = interpolatePath(path, 0);
    await recordLocation({
      tripId: rows[0].id,
      lat: start.lat,
      lng: start.lng,
      speedKmh: 18,
      heading: start.heading,
      progress: 0,
      currentStopIndex: 0,
      occupancy: 10,
    });
    emitTrip(rows[0]);
  } else {
    emitTracking({ buses: await getActiveTracking(), changedTripId: tripId });
  }
}

module.exports = {
  setIo,
  emitTracking,
  emitTrip,
  emitNotification,
  emitEmergency,
  getActiveTracking,
  recordLocation,
  simulateTick,
  completeTrip,
};
