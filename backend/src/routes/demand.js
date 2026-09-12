const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { predictDemand } = require('../utils/demand');

const router = express.Router();

router.get('/route/:routeId', authenticate, async (req, res) => {
  try {
    const hour = req.query.hour != null ? Number(req.query.hour) : new Date().getHours();
    const day = req.query.day != null ? Number(req.query.day) : new Date().getDay();
    
    const routeRes = await query('SELECT * FROM routes WHERE id = $1', [req.params.routeId]);
    if (!routeRes.rows[0]) return res.status(404).json({ error: 'Route not found' });
    
    // Get active buses on this route to determine capacity
    const busRes = await query(
      `SELECT AVG(b.capacity)::int as avg_capacity FROM buses b
       JOIN drivers d ON d.assigned_bus_id = b.id
       WHERE d.assigned_route_id = $1`,
      [req.params.routeId]
    );
    const capacity = busRes.rows[0]?.avg_capacity || 40;
    
    const samples = await query(
      'SELECT hour_of_day, day_of_week, passenger_count FROM historical_demand WHERE route_id = $1',
      [req.params.routeId]
    );
    
    const prediction = predictDemand({
      samples: samples.rows,
      hour,
      day,
      capacity,
    });
    
    // Check for capacity risk
    const capacityRisk = prediction.predictedPassengers > capacity * 0.85;
    const utilization = Math.round((prediction.predictedPassengers / capacity) * 100);
    
    await query(
      `INSERT INTO demand_predictions (route_id, hour_of_day, day_of_week, predicted_passengers, level)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.routeId, hour, day, prediction.predictedPassengers, prediction.level]
    );
    
    const hourly = [];
    for (let h = 7; h <= 20; h += 1) {
      const hourPred = predictDemand({ samples: samples.rows, hour: h, day, capacity });
      hourly.push({
        hour: h,
        ...hourPred,
        capacityRisk: hourPred.predictedPassengers > capacity * 0.85,
      });
    }
    
    return res.json({
      routeId: req.params.routeId,
      routeName: routeRes.rows[0].name,
      hour,
      day,
      capacity,
      ...prediction,
      utilization,
      capacityRisk,
      recommendation: capacityRisk ? 'Consider adding additional bus for this time slot' : 'Adequate capacity',
      hourly,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to predict demand' });
  }
});

// Get all active trip capacity risks
router.get('/active-trips', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.id, t.bus_id, b.number, b.capacity, t.occupancy, r.id AS route_id, r.name AS route_name, 
              ROUND((t.occupancy::float / b.capacity) * 100)::int as utilization
       FROM trips t
       JOIN buses b ON b.id = t.bus_id
       JOIN routes r ON r.id = t.route_id
       WHERE t.status IN ('active', 'delayed')
       ORDER BY utilization DESC`
    );
    
    const capacityRisks = rows.filter(t => t.utilization > 85);
    return res.json({
      activeTrips: rows,
      capacityRisks,
      highUtilizationCount: capacityRisks.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load capacity data' });
  }
});

module.exports = router;
