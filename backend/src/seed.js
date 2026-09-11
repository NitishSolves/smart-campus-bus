const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { pool, query } = require('./db');
const { interpolatePath } = require('./utils/geo');

const STOPS = [
  { name: 'Main Gate', lat: 12.9700, lng: 77.5900, description: 'Campus entrance and security checkpoint' },
  { name: 'Library', lat: 12.9758, lng: 77.5964, description: 'Central library and reading halls' },
  { name: 'Academic Block', lat: 12.9812, lng: 77.5990, description: 'Lecture halls and faculty offices' },
  { name: 'Engineering Block', lat: 12.9844, lng: 77.5952, description: 'Labs and engineering departments' },
  { name: 'Cafeteria', lat: 12.9766, lng: 77.5868, description: 'Food court and student hangout' },
  { name: 'Hostel', lat: 12.9880, lng: 77.5884, description: 'Residential halls' },
  { name: 'Sports Complex', lat: 12.9822, lng: 77.5826, description: 'Stadium, courts and gym' },
];

function lerp(a, b, t) {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

function densify(points, steps = 6) {
  const path = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    for (let s = 0; s < steps; s += 1) {
      path.push(lerp(points[i], points[i + 1], s / steps));
    }
  }
  path.push(points[points.length - 1]);
  return path;
}

async function seed() {
  const hash = (plain) => bcrypt.hash(plain, 10);
  const studentHash = await hash('student123');
  const driverHash = await hash('driver123');
  const adminHash = await hash('admin123');

  const stopIds = {};
  for (const stop of STOPS) {
    const { rows } = await query(
      `INSERT INTO stops (name, lat, lng, description) VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO UPDATE SET lat = EXCLUDED.lat, lng = EXCLUDED.lng
       RETURNING id, name, lat, lng`,
      [stop.name, stop.lat, stop.lng, stop.description]
    );
    stopIds[stop.name] = rows[0];
  }

  const s = (name) => stopIds[name];

  const routeAPath = densify([s('Main Gate'), s('Library'), s('Cafeteria'), s('Hostel')]);
  const routeBPath = densify([s('Main Gate'), s('Library'), s('Academic Block'), s('Engineering Block')]);
  const routeCPath = densify([s('Hostel'), s('Cafeteria'), s('Engineering Block'), s('Sports Complex')]);

  const routesSpec = [
    {
      code: 'A',
      name: 'Main Gate to Hostel',
      start: 'Main Gate',
      end: 'Hostel',
      duration: 16,
      path: routeAPath,
      stops: ['Main Gate', 'Library', 'Cafeteria', 'Hostel'],
    },
    {
      code: 'B',
      name: 'Main Gate to Academic Block',
      start: 'Main Gate',
      end: 'Engineering Block',
      duration: 14,
      path: routeBPath,
      stops: ['Main Gate', 'Library', 'Academic Block', 'Engineering Block'],
    },
    {
      code: 'C',
      name: 'Hostel to Sports Complex',
      start: 'Hostel',
      end: 'Sports Complex',
      duration: 12,
      path: routeCPath,
      stops: ['Hostel', 'Cafeteria', 'Engineering Block', 'Sports Complex'],
    },
  ];

  const routeIds = {};
  for (const route of routesSpec) {
    const { rows } = await query(
      `INSERT INTO routes (code, name, start_name, end_name, status, duration_minutes, path)
       VALUES ($1, $2, $3, $4, 'active', $5, $6)
       ON CONFLICT (code) DO UPDATE SET path = EXCLUDED.path, name = EXCLUDED.name
       RETURNING id, code`,
      [route.code, route.name, route.start, route.end, route.duration, JSON.stringify(route.path)]
    );
    routeIds[route.code] = rows[0].id;
    await query('DELETE FROM route_stops WHERE route_id = $1', [rows[0].id]);
    for (let i = 0; i < route.stops.length; i += 1) {
      await query(
        'INSERT INTO route_stops (route_id, stop_id, stop_order) VALUES ($1, $2, $3)',
        [rows[0].id, s(route.stops[i]).id, i + 1]
      );
    }
  }

  const buses = [
    { number: 'BUS-01', capacity: 40, status: 'active' },
    { number: 'BUS-02', capacity: 40, status: 'idle' },
    { number: 'BUS-03', capacity: 36, status: 'active' },
    { number: 'BUS-04', capacity: 32, status: 'idle' },
  ];
  const busIds = {};
  for (const bus of buses) {
    const { rows } = await query(
      `INSERT INTO buses (number, capacity, status) VALUES ($1, $2, $3)
       ON CONFLICT (number) DO UPDATE SET status = EXCLUDED.status
       RETURNING id, number`,
      [bus.number, bus.capacity, bus.status]
    );
    busIds[bus.number] = rows[0].id;
  }

  const student = await query(
    `INSERT INTO users (email, password_hash, full_name, role, phone, default_stop_id)
     VALUES ($1, $2, $3, 'student', $4, $5)
     ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
     RETURNING id`,
    ['student@campus.edu', studentHash, 'Aisha Rahman', '+91 90000 11111', s('Library').id]
  );

  const admin = await query(
    `INSERT INTO users (email, password_hash, full_name, role, phone)
     VALUES ($1, $2, $3, 'admin', $4)
     ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
     RETURNING id`,
    ['admin@campus.edu', adminHash, 'Campus Transport Admin', '+91 90000 00000']
  );

  const driverUsers = [
    { email: 'driver@campus.edu', name: 'Ravi Kumar', phone: '+91 90000 22222', license: 'KA-DRV-4411', bus: 'BUS-01', route: 'A' },
    { email: 'driver2@campus.edu', name: 'Meera Iyer', phone: '+91 90000 33333', license: 'KA-DRV-5522', bus: 'BUS-03', route: 'B' },
    { email: 'driver3@campus.edu', name: 'Arjun Patel', phone: '+91 90000 44444', license: 'KA-DRV-6633', bus: 'BUS-02', route: 'C' },
  ];
  const driverIds = {};
  for (const d of driverUsers) {
    const u = await query(
      `INSERT INTO users (email, password_hash, full_name, role, phone)
       VALUES ($1, $2, $3, 'driver', $4)
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [d.email, driverHash, d.name, d.phone]
    );
    const dr = await query(
      `INSERT INTO drivers (user_id, license_no, assigned_bus_id, assigned_route_id, status)
       VALUES ($1, $2, $3, $4, 'on_duty')
       ON CONFLICT (user_id) DO UPDATE SET assigned_bus_id = EXCLUDED.assigned_bus_id, assigned_route_id = EXCLUDED.assigned_route_id
       RETURNING id`,
      [u.rows[0].id, d.license, busIds[d.bus], routeIds[d.route]]
    );
    driverIds[d.email] = dr.rows[0].id;
  }

  for (const [code, routeId] of Object.entries(routeIds)) {
    const spec = routesSpec.find((r) => r.code === code);
    for (let day = 0; day < 7; day += 1) {
      for (let hour = 7; hour <= 20; hour += 1) {
        const peak = (hour >= 8 && hour <= 10) || (hour >= 16 && hour <= 18);
        const weekend = day === 0 || day === 6;
        const base = code === 'A' ? 22 : code === 'B' ? 26 : 16;
        const count = Math.max(4, Math.round((base + (peak ? 14 : 0) - (weekend ? 8 : 0)) * (0.85 + Math.random() * 0.3)));
        await query(
          `INSERT INTO historical_demand (route_id, hour_of_day, day_of_week, passenger_count, recorded_on)
           VALUES ($1, $2, $3, $4, CURRENT_DATE - ($5 || ' days')::interval)`,
          [routeId, hour, day, count, String((day + hour) % 5)]
        );
      }
    }
    for (let i = 0; i < spec.stops.length - 1; i += 1) {
      await query(
        `INSERT INTO historical_segment_times (route_id, from_stop_id, to_stop_id, avg_seconds, sample_count)
         VALUES ($1, $2, $3, $4, 48)`,
        [routeId, s(spec.stops[i]).id, s(spec.stops[i + 1]).id, 360 + i * 80]
      );
    }
  }

  const tripA = await query(
    `INSERT INTO trips (bus_id, driver_id, route_id, status, occupancy, started_at, progress, current_stop_index)
     VALUES ($1, $2, $3, 'active', 18, NOW() - INTERVAL '2 minutes', 0.02, 0)
     RETURNING id`,
    [busIds['BUS-01'], driverIds['driver@campus.edu'], routeIds.A]
  );
  const tripB = await query(
    `INSERT INTO trips (bus_id, driver_id, route_id, status, occupancy, started_at, progress, current_stop_index)
     VALUES ($1, $2, $3, 'active', 24, NOW() - INTERVAL '6 minutes', 0.22, 0)
     RETURNING id`,
    [busIds['BUS-03'], driverIds['driver2@campus.edu'], routeIds.B]
  );

  const pointA = interpolatePath(routeAPath, 0.08);
  const pointB = interpolatePath(routeBPath, 0.22);
  await query(
    `INSERT INTO bus_locations (trip_id, bus_id, lat, lng, speed_kmh, heading)
     VALUES ($1, $2, $3, $4, 20, $5)`,
    [tripA.rows[0].id, busIds['BUS-01'], pointA.lat, pointA.lng, pointA.heading]
  );
  await query(
    `INSERT INTO bus_locations (trip_id, bus_id, lat, lng, speed_kmh, heading)
     VALUES ($1, $2, $3, $4, 18, $5)`,
    [tripB.rows[0].id, busIds['BUS-03'], pointB.lat, pointB.lng, pointB.heading]
  );

  await query(`UPDATE drivers SET status = 'on_trip' WHERE id = ANY($1)`, [
    [driverIds['driver@campus.edu'], driverIds['driver2@campus.edu']],
  ]);

  await query(
    `INSERT INTO announcements (title, body, severity, created_by, is_active)
     VALUES ($1, $2, 'info', $3, TRUE), ($4, $5, 'warning', $3, TRUE)`,
    [
      'Evening shuttle extra trip',
      'Route A will run an extra Hostel trip at 9:15 PM during midterms.',
      admin.rows[0].id,
      'Library stop boarding delay',
      'Expect 3 extra minutes at Library during 5–6 PM due to event crowd.',
    ]
  );

  await query(
    `INSERT INTO notifications (user_id, type, title, body, related_route_id)
     VALUES
     ($1, 'arrival', 'BUS-01 approaching Library', 'Route A is about 6 minutes from Library.', $2),
     ($1, 'announcement', 'Evening shuttle extra trip', 'Route A extra Hostel trip at 9:15 PM.', $2)`,
    [student.rows[0].id, routeIds.A]
  );

  await query(
    `INSERT INTO favorites (user_id, target_type, target_id)
     VALUES ($1, 'route', $2), ($1, 'stop', $3), ($1, 'bus', $4)
     ON CONFLICT DO NOTHING`,
    [student.rows[0].id, routeIds.A, s('Library').id, busIds['BUS-01']]
  );

  const completed = await query(
    `INSERT INTO trips (bus_id, driver_id, route_id, status, occupancy, started_at, ended_at, progress, current_stop_index)
     VALUES ($1, $2, $3, 'completed', 22, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '105 minutes', 1, 3)
     RETURNING id`,
    [busIds['BUS-02'], driverIds['driver3@campus.edu'], routeIds.C]
  );
  void completed;

  console.log('Seed complete');
  console.log('Students: student@campus.edu / student123');
  console.log('Driver:   driver@campus.edu / driver123');
  console.log('Admin:    admin@campus.edu / admin123');
}

if (require.main === module) {
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  pool.query(`SELECT to_regclass('public.users') AS t`).then(async (check) => {
    if (!check.rows[0].t) {
      await pool.query(fs.readFileSync(schemaPath, 'utf8'));
    }
    await seed();
    await pool.end();
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seed };
