const express = require('express');
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
    const { tripId, lat, lng, speedKmh, heading, progress, currentStopIndex, occupancy } = req.body || {};
    if (!tripId || lat == null || lng == null) {
      return res.status(400).json({ error: 'tripId, lat and lng are required' });
    }
    const record = await tracking.recordLocation({
      tripId, lat, lng, speedKmh, heading, progress, currentStopIndex, occupancy,
    });
    return res.json({ location: record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update location' });
  }
});

module.exports = router;
