const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { predictDemand } = require('../utils/demand');

const router = express.Router();

router.get('/route/:routeId', authenticate, async (req, res) => {
  try {
    const hour = req.query.hour != null ? Number(req.query.hour) : new Date().getHours();
    const day = req.query.day != null ? Number(req.query.day) : new Date().getDay();
    const samples = await query(
      'SELECT hour_of_day, day_of_week, passenger_count FROM historical_demand WHERE route_id = $1',
      [req.params.routeId]
    );
    const route = await query('SELECT * FROM routes WHERE id = $1', [req.params.routeId]);
    if (!route.rows[0]) return res.status(404).json({ error: 'Route not found' });
    const prediction = predictDemand({
      samples: samples.rows,
      hour,
      day,
      capacity: 40,
    });
    await query(
      `INSERT INTO demand_predictions (route_id, hour_of_day, day_of_week, predicted_passengers, level)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.routeId, hour, day, prediction.predictedPassengers, prediction.level]
    );
    const hourly = [];
    for (let h = 7; h <= 20; h += 1) {
      hourly.push({
        hour: h,
        ...predictDemand({ samples: samples.rows, hour: h, day, capacity: 40 }),
      });
    }
    return res.json({ routeId: req.params.routeId, hour, day, ...prediction, hourly });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to predict demand' });
  }
});

module.exports = router;
