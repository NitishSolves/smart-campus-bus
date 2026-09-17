const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Fail fast with a clear, credential-free message instead of a cryptic pg error later.
  throw new Error(
    'DATABASE_URL is not configured. Copy backend/.env.example to backend/.env and set a valid PostgreSQL connection string.'
  );
}

function resolveSsl() {
  const explicit = String(process.env.DATABASE_SSL || process.env.PGSSLMODE || '').toLowerCase();
  if (['true', 'require', 'prefer'].includes(explicit)) {
    return { rejectUnauthorized: false };
  }
  if (['false', 'disable'].includes(explicit)) {
    return false;
  }
  // Managed providers (Render, Heroku, etc.) usually embed sslmode in the URL.
  if (/[?&]ssl(mode)?=(require|true)/i.test(connectionString)) {
    return { rejectUnauthorized: false };
  }
  return false;
}

const pool = new Pool({
  connectionString,
  max: Number(process.env.PG_POOL_MAX || 12),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: resolveSsl(),
});

pool.on('error', (err) => {
  // Keep the process alive on idle-client errors but surface a sanitized message.
  console.error('[db] unexpected idle client error:', err.message);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function healthCheck() {
  const startedAt = Date.now();
  const { rows } = await pool.query('SELECT 1 AS ok');
  return { ok: rows[0]?.ok === 1, latencyMs: Date.now() - startedAt };
}

async function close() {
  await pool.end();
}

module.exports = { pool, query, healthCheck, close };
