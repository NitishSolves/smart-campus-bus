const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { computeStopEta } = require('../utils/eta');

const router = express.Router();

router.get('/trip/:tripId', authenticate, async (req, res) => {
  try {
    const tripRes = await query(
      `SELECT t.*, r.path, loc.lat, loc.lng, loc.speed_kmh, loc.recorded_at
       FROM trips t
       JOIN routes r ON r.id = t.route_id
       LEFT JOIN LATERAL (
         SELECT lat, lng, speed_kmh, recorded_at FROM bus_locations WHERE trip_id = t.id ORDER BY recorded_at DESC LIMIT 1
       ) loc ON TRUE
       WHERE t.id = $1`,
      [req.params.tripId]
    );
    if (!tripRes.rows[0]) return res.status(404).json({ error: 'Trip not found' });
    const trip = tripRes.rows[0];
    const stops = await query(
      `SELECT s.*, rs.stop_order
       FROM route_stops rs JOIN stops s ON s.id = rs.stop_id
       WHERE rs.route_id = $1 ORDER BY rs.stop_order`,
      [trip.route_id]
    );
    const path = Array.isArray(trip.path) ? trip.path : [];
    const point = trip.lat != null && trip.lng != null
      ? { lat: Number(trip.lat), lng: Number(trip.lng) }
      : null;
    const predictions = [];
    for (const stop of stops.rows) {
      const hist = await query(
        `SELECT avg_seconds FROM historical_segment_times
         WHERE route_id = $1 AND to_stop_id = $2 LIMIT 1`,
        [trip.route_id, stop.id]
      );
      const eta = computeStopEta({
        point,
        path,
        stop: { lat: Number(stop.lat), lng: Number(stop.lng) },
        speedKmh: Number(trip.speed_kmh ?? 0),
        historicalSeconds: hist.rows[0]?.avg_seconds,
        delayMinutes: Number(trip.delay_minutes || 0),
        lastLocationTime: trip.recorded_at,
        tripStatus: trip.status,
      });
      if (eta.available) {
        await query(
          `INSERT INTO eta_predictions (trip_id, stop_id, eta_minutes, remaining_distance_m, method)
           VALUES ($1, $2, $3, $4, $5)`,
          [trip.id, stop.id, eta.etaMinutes, eta.remainingDistanceM, eta.calculationMode]
        );
      }
      predictions.push({
        stopId: stop.id,
        stopName: stop.name,
        stopOrder: stop.stop_order,
        etaMinutes: eta.etaMinutes,
        remainingDistanceM: eta.remainingDistanceM,
        calculationMode: eta.calculationMode,
        isStale: eta.isStale,
        routeMismatch: eta.routeMismatch,
        available: eta.available,
        lastUpdated: eta.lastUpdated,
      });
    }
    return res.json({ tripId: trip.id, predictions, busStatus: trip.status });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to compute ETA' });
  }
});

module.exports = router;
