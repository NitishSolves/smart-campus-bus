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
    
    // Count active emergencies
    const emergencies = await query(`SELECT COUNT(*)::int AS n FROM emergency_alerts WHERE status IN ('active', 'acknowledged')`);
    
    // Find capacity risks
    const capacityRisks = await query(
      `SELECT COUNT(*)::int AS n FROM trips t
       JOIN buses b ON b.id = t.bus_id
       WHERE t.status IN ('active', 'delayed')
       AND t.occupancy > (b.capacity * 0.85)`
    );
    
    // Get stale location count (no update in 5 minutes)
    const staleGPS = await query(
      `SELECT COUNT(DISTINCT t.id)::int AS n FROM trips t
       JOIN buses b ON b.id = t.bus_id
       LEFT JOIN LATERAL (
         SELECT recorded_at FROM bus_locations WHERE trip_id = t.id
         ORDER BY recorded_at DESC LIMIT 1
       ) loc ON TRUE
       WHERE t.status IN ('active', 'delayed')
       AND (loc.recorded_at IS NULL OR loc.recorded_at < NOW() - INTERVAL '5 minutes')`
    );
    
    return res.json({
      activeBuses: activeBuses.rows[0].n,
      totalBuses: totalBuses.rows[0].n,
      activeRoutes: activeRoutes.rows[0].n,
      activeTrips: activeTrips.rows[0].n,
      todayTrips: todayTrips.rows[0].n,
      delayedTrips: delayed.rows[0].n,
      drivers: drivers.rows[0].n,
      activeEmergencies: emergencies.rows[0].n,
      capacityRisks: capacityRisks.rows[0].n,
      staleGPS: staleGPS.rows[0].n,
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

// Emergency Alerts
router.get('/emergencies', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT ea.*, b.number AS bus_number, d.id AS driver_row_id, u.full_name AS driver_name, r.name AS route_name
       FROM emergency_alerts ea
       JOIN buses b ON b.id = ea.bus_id
       JOIN drivers d ON d.id = ea.driver_id
       JOIN users u ON u.id = d.user_id
       JOIN trips t ON t.id = ea.trip_id
       JOIN routes r ON r.id = t.route_id
       WHERE ea.status IN ('active', 'acknowledged')
       ORDER BY ea.created_at DESC LIMIT 50`
    );
    return res.json({ emergencies: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load emergencies' });
  }
});

router.put('/emergencies/:id/acknowledge', async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE emergency_alerts
       SET status = 'acknowledged',
           acknowledged_at = NOW(),
           acknowledged_by = $1,
           updated_at = NOW()
       WHERE id = $2 AND status = 'active'
       RETURNING *`,
      [req.user.id, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Emergency not found or already handled' });
    return res.json({ alert: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to acknowledge emergency' });
  }
});

router.put('/emergencies/:id/resolve', async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE emergency_alerts
       SET status = 'resolved',
           acknowledged_at = NOW(),
           acknowledged_by = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [req.user.id, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Emergency not found' });
    return res.json({ alert: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to resolve emergency' });
  }
});

// Announcements Management
router.get('/announcements', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT a.*, u.full_name AS created_by_name
       FROM announcements a
       LEFT JOIN users u ON u.id = a.created_by
       ORDER BY a.created_at DESC LIMIT 100`
    );
    return res.json({ announcements: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load announcements' });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, body, severity = 'info' } = req.body || {};
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }
    const { rows } = await query(
      `INSERT INTO announcements (title, body, severity, created_by, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING *`,
      [title, body, severity, req.user.id]
    );
    return res.status(201).json({ announcement: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create announcement' });
  }
});

router.put('/announcements/:id', async (req, res) => {
  try {
    const { title, body, severity, isActive } = req.body || {};
    const { rows } = await query(
      `UPDATE announcements
       SET title = COALESCE($1, title),
           body = COALESCE($2, body),
           severity = COALESCE($3, severity),
           is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING *`,
      [title || null, body || null, severity || null, isActive ?? null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Announcement not found' });
    return res.json({ announcement: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update announcement' });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    const { rows } = await query('DELETE FROM announcements WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Announcement not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;
