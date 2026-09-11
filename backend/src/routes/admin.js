const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

router.get('/overview', async (_req, res) => {
  try {
    const activeBuses = await query(`SELECT COUNT(*)::int AS n FROM buses WHERE status = 'active'`);
    const totalBuses = await query('SELECT COUNT(*)::int AS n FROM buses');
    const activeRoutes = await query(`SELECT COUNT(*)::int AS n FROM routes WHERE status = 'active'`);
    const activeTrips = await query(`SELECT COUNT(*)::int AS n FROM trips WHERE status IN ('active', 'delayed')`);
    const todayTrips = await query(`SELECT COUNT(*)::int AS n FROM trips WHERE created_at::date = CURRENT_DATE`);
    const delayed = await query(`SELECT COUNT(*)::int AS n FROM trips WHERE status = 'delayed'`);
    const drivers = await query('SELECT COUNT(*)::int AS n FROM drivers');
    return res.json({
      activeBuses: activeBuses.rows[0].n,
      totalBuses: totalBuses.rows[0].n,
      activeRoutes: activeRoutes.rows[0].n,
      activeTrips: activeTrips.rows[0].n,
      todayTrips: todayTrips.rows[0].n,
      delayedTrips: delayed.rows[0].n,
      drivers: drivers.rows[0].n,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load overview' });
  }
});

router.get('/drivers', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT d.*, u.full_name, u.email, u.phone, b.number AS bus_number, r.code AS route_code, r.name AS route_name
       FROM drivers d
       JOIN users u ON u.id = d.user_id
       LEFT JOIN buses b ON b.id = d.assigned_bus_id
       LEFT JOIN routes r ON r.id = d.assigned_route_id
       ORDER BY u.full_name`
    );
    return res.json({ drivers: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load drivers' });
  }
});

router.post('/drivers', async (req, res) => {
  try {
    const { email, password, fullName, licenseNo, busId, routeId, phone } = req.body || {};
    if (!email || !password || !fullName || !licenseNo) {
      return res.status(400).json({ error: 'Missing required driver fields' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await query(
      `INSERT INTO users (email, password_hash, full_name, role, phone)
       VALUES ($1, $2, $3, 'driver', $4) RETURNING id, email, full_name, role`,
      [email.toLowerCase(), hash, fullName, phone || null]
    );
    const driver = await query(
      `INSERT INTO drivers (user_id, license_no, assigned_bus_id, assigned_route_id, status)
       VALUES ($1, $2, $3, $4, 'off_duty') RETURNING *`,
      [user.rows[0].id, licenseNo, busId || null, routeId || null]
    );
    return res.status(201).json({ driver: { ...driver.rows[0], ...user.rows[0] } });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    console.error(err);
    return res.status(500).json({ error: 'Failed to create driver' });
  }
});

router.put('/drivers/:id', async (req, res) => {
  try {
    const { licenseNo, busId, routeId, status } = req.body || {};
    const { rows } = await query(
      `UPDATE drivers
       SET license_no = COALESCE($1, license_no),
           assigned_bus_id = COALESCE($2, assigned_bus_id),
           assigned_route_id = COALESCE($3, assigned_route_id),
           status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [licenseNo || null, busId || null, routeId || null, status || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Driver not found' });
    return res.json({ driver: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update driver' });
  }
});

router.get('/analytics', async (_req, res) => {
  try {
    const tripsPerDay = await query(
      `SELECT created_at::date AS day, COUNT(*)::int AS trips,
              AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, NOW()) - COALESCE(started_at, created_at))) / 60)::int AS avg_duration
       FROM trips
       WHERE created_at > NOW() - INTERVAL '7 days'
       GROUP BY 1 ORDER BY 1`
    );
    const routeUsage = await query(
      `SELECT r.code, r.name, COUNT(t.id)::int AS trips,
              AVG(t.occupancy)::int AS avg_occupancy,
              SUM(CASE WHEN t.status = 'delayed' THEN 1 ELSE 0 END)::int AS delays
       FROM routes r
       LEFT JOIN trips t ON t.route_id = r.id
       GROUP BY r.id
       ORDER BY trips DESC`
    );
    const occupancy = await query(
      `SELECT r.code, AVG(t.occupancy)::numeric(10,1) AS avg_occupancy, MAX(t.occupancy)::int AS peak
       FROM trips t JOIN routes r ON r.id = t.route_id
       GROUP BY r.code ORDER BY r.code`
    );
    const etaAccuracy = await query(
      `SELECT COUNT(*)::int AS samples, AVG(eta_minutes)::numeric(10,1) AS avg_predicted
       FROM eta_predictions WHERE created_at > NOW() - INTERVAL '1 day'`
    );
    const peakHours = await query(
      `SELECT hour_of_day, AVG(passenger_count)::int AS avg_passengers
       FROM historical_demand
       GROUP BY hour_of_day ORDER BY hour_of_day`
    );
    return res.json({
      tripsPerDay: tripsPerDay.rows,
      routeUsage: routeUsage.rows,
      occupancy: occupancy.rows,
      etaAccuracy: etaAccuracy.rows[0],
      peakHours: peakHours.rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load analytics' });
  }
});

module.exports = router;
