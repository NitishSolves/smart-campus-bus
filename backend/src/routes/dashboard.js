const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const tracking = require('../services/tracking');
const { crowdLevel } = require('../utils/geo');
const { computeStopEta } = require('../utils/eta');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const buses = await tracking.getActiveTracking();
    const favStop = req.user.default_stop_id;
    let targetStop = null;
    if (favStop) {
      const stopRes = await query('SELECT * FROM stops WHERE id = $1', [favStop]);
      targetStop = stopRes.rows[0] || null;
    }
    const withStudentEta = buses.map((bus) => {
      if (!targetStop) return bus;
      const serves = (bus.stops || []).some((s) => s.id === targetStop.id);
      if (!serves) return { ...bus, etaMinutes: bus.etaMinutes + 1000, studentStop: false };
      const eta = computeStopEta({
        point: { lat: bus.lat, lng: bus.lng },
        path: bus.path || [],
        stop: { lat: Number(targetStop.lat), lng: Number(targetStop.lng) },
        speedKmh: bus.speedKmh || 12,
        delayMinutes: bus.delayMinutes || 0,
      });
      return {
        ...bus,
        etaMinutes: eta.etaMinutes,
        remainingDistanceM: eta.remainingDistanceM,
        nextStop: { id: targetStop.id, name: targetStop.name, lat: targetStop.lat, lng: targetStop.lng },
        studentStop: true,
      };
    });
    const favoriteRouteIds = new Set(
      (await query("SELECT target_id FROM favorites WHERE user_id = $1 AND target_type = 'route'", [req.user.id])).rows.map((r) => r.target_id)
    );
    const sorted = [...withStudentEta].sort((a, b) => {
      const af = favoriteRouteIds.has(a.routeId) ? 0 : 1;
      const bf = favoriteRouteIds.has(b.routeId) ? 0 : 1;
      if (af !== bf) return af - bf;
      return a.etaMinutes - b.etaMinutes;
    });
    const nextBus = sorted.find((b) => b.studentStop !== false) || sorted[0] || null;
    const announcements = await query(
      'SELECT * FROM announcements WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 5'
    );
    const favorites = await query('SELECT * FROM favorites WHERE user_id = $1', [req.user.id]);
    const notifications = await query(
      'SELECT * FROM notifications WHERE (user_id = $1 OR user_id IS NULL) ORDER BY created_at DESC LIMIT 8',
      [req.user.id]
    );
    const routes = await query('SELECT id, code, name, start_name, end_name, status, duration_minutes FROM routes ORDER BY code');
    return res.json({
      nextBus: nextBus
        ? {
            ...nextBus,
            crowd: crowdLevel(nextBus.occupancy, nextBus.capacity),
          }
        : null,
      activeBuses: buses,
      announcements: announcements.rows,
      favorites: favorites.rows,
      notifications: notifications.rows,
      routes: routes.rows,
      defaultStopId: favStop,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

module.exports = router;
