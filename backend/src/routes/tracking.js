const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const tracking = require('../services/tracking');

const router = express.Router();

router.get('/active', authenticate, async (_req, res) => {
  try {
    const buses = await tracking.getActiveTracking();
    return res.json({ buses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load tracking' });
  }
});

router.get('/bus/:id', authenticate, async (req, res) => {
  try {
    const buses = await tracking.getActiveTracking();
    const bus = buses.find((b) => b.busId === req.params.id || b.busNumber === req.params.id);
    if (!bus) return res.status(404).json({ error: 'Active bus not found' });
    return res.json({ bus });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load bus tracking' });
  }
});

router.post('/location', authenticate, requireRole('driver', 'admin'), async (req, res) => {
  try {
    const { tripId, lat, lng, speedKmh, heading, progress, currentStopIndex, occupancy, source = 'device' } = req.body || {};
    if (!tripId || lat == null || lng == null) {
      return res.status(400).json({ error: 'tripId, lat and lng are required' });
    }
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    if (req.user.role === 'driver') {
      const owned = await query(
        `SELECT t.id FROM trips t JOIN drivers d ON d.id = t.driver_id
         WHERE t.id = $1 AND d.user_id = $2`,
        [tripId, req.user.id]
      );
      if (!owned.rows[0]) return res.status(403).json({ error: 'Not your trip' });
    }
    const record = await tracking.recordLocation({
      tripId, lat: latNum, lng: lngNum, speedKmh, heading, progress, currentStopIndex, occupancy, source,
    });
    if (!record) return res.status(404).json({ error: 'Trip not found' });
    return res.json({ location: record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update location' });
  }
});

module.exports = router;
