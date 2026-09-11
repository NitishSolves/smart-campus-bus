require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const { pool } = require('./db');
const tracking = require('./services/tracking');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
  },
});
tracking.setIo(io);

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'smart-campus-bus' }));

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
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

io.on('connection', (socket) => {
  socket.emit('connected', { ok: true });
});

const PORT = Number(process.env.PORT || 3001);

async function ensureSchema() {
  const check = await pool.query(`SELECT to_regclass('public.users') AS t`);
  if (check.rows[0].t) return;
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(sql);
}

async function start() {
  await ensureSchema();
  const count = await pool.query('SELECT COUNT(*)::int AS n FROM users');
  if (count.rows[0].n === 0) {
    require('./seed').seed().catch((err) => console.error('Seed error', err));
  }
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`API listening on ${PORT}`);
  });
  setInterval(() => {
    tracking.simulateTick().catch((err) => console.error('sim tick', err));
  }, 2500);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

module.exports = { app, server, io };
