require('dotenv').config();

const { validateEnv } = require('./config');
const { env, problems } = validateEnv();

if (problems.length) {
  console.error('[config] Refusing to start due to invalid configuration:');
  problems.forEach((problem) => console.error(`  - ${problem}`));
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { pool, healthCheck, close: closeDb } = require('./db');
const tracking = require('./services/tracking');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = new Set([
  'https://smart-campus-bus-one.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...env.corsOrigins,
]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  if (/^https:\/\/smart-campus-bus[a-z0-9-]*\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.monkeycode-ai\.live$/i.test(origin)) return true;
  if (!env.isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
};

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
tracking.setIo(io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    socket.user = { id: payload.id, role: payload.role };
    return next();
  } catch {
    return next(new Error('Invalid or expired token'));
  }
});

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  return next();
});
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/api/health', async (_req, res) => {
  try {
    const db = await healthCheck();
    return res.json({
      ok: true,
      service: 'smart-campus-bus',
      environment: env.nodeEnv,
      database: db.ok ? 'connected' : 'unavailable',
      dbLatencyMs: db.latencyMs,
      time: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[health] database check failed:', err.message);
    return res.status(503).json({
      ok: false,
      service: 'smart-campus-bus',
      environment: env.nodeEnv,
      database: 'unavailable',
      time: new Date().toISOString(),
    });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/buses', require('./routes/buses'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/stops', require('./routes/stops'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/eta', require('./routes/eta'));
app.use('/api/demand', require('./routes/demand'));
app.use('/api/driver', require('./routes/driver'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

app.use((err, _req, res, _next) => {
  console.error('[server] unhandled error:', env.isProduction ? err.message : err);
  res.status(500).json({ error: 'Server error' });
});

io.on('connection', (socket) => {
  socket.emit('connected', { ok: true, role: socket.user?.role });
});

async function runMigrations() {
  // Older databases created before the emergency alert feature only allow a
  // limited set of notification types. Keep this idempotent so existing
  // deployments upgrade automatically.
  await pool.query(`
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
      CHECK (type IN ('arrival', 'delay', 'cancellation', 'announcement', 'emergency'));
  `);
}

async function ensureSchema() {
  const check = await pool.query(`SELECT to_regclass('public.users') AS t`);
  if (!check.rows[0].t) {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);
  }
  await runMigrations();
}

let simulatorTimer = null;

async function start() {
  await ensureSchema();
  const count = await pool.query('SELECT COUNT(*)::int AS n FROM users');
  if (count.rows[0].n === 0) {
    await require('./seed').seed();
  }
  server.listen(env.port, '0.0.0.0', () => {
    console.log(`[server] API listening on port ${env.port} (${env.nodeEnv})`);
  });
  // Demo simulator: moves seeded/auto-started trips along their route. Trips
  // that report real device GPS are skipped (see services/tracking.js).
  simulatorTimer = setInterval(() => {
    tracking.simulateTick().catch((err) => console.error('[simulator] tick failed:', err.message));
  }, 2500);
}

function shutdown(signal) {
  console.log(`[server] ${signal} received, shutting down`);
  if (simulatorTimer) clearInterval(simulatorTimer);
  server.close(async () => {
    try {
      await closeDb();
    } finally {
      process.exit(0);
    }
  });
  setTimeout(() => process.exit(0), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (require.main === module) {
  start().catch((err) => {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  });
}

module.exports = { app, server, io, start };
