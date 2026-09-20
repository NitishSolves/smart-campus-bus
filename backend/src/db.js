const { Pool } = require('pg');
const crypto = require('crypto');

const connectionString = process.env.DATABASE_URL;

let pool;
let isInMemory = false;

function createInMemoryDb() {
  const { newDb } = require('pg-mem');
  const db = newDb();

  // Register pgcrypto extension & gen_random_uuid
  db.registerExtension('pgcrypto', (schema) => {
    schema.registerFunction({
      name: 'gen_random_uuid',
      returns: db.public.getType('uuid'),
      implementation: () => crypto.randomUUID(),
      impure: true,
    });
  });
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: db.public.getType('uuid'),
    implementation: () => crypto.randomUUID(),
    impure: true,
  });
  db.public.registerFunction({
    name: 'to_regclass',
    args: [db.public.getType('text')],
    returns: db.public.getType('text'),
    implementation: (name) => {
      const cleanName = String(name || '').replace(/^public\./, '').replace(/['"]/g, '');
      try {
        const table = db.public.getTable(cleanName);
        return table ? name : null;
      } catch {
        return null;
      }
    },
  });

  const pgAdapter = db.adapters.createPg();
  const memPool = new pgAdapter.Pool();
  isInMemory = true;
  console.log('[db] Running with fast in-memory PostgreSQL database engine');
  return memPool;
}

// In AI Studio / demo sandbox, if DATABASE_URL is pointing to an unconfigured localhost, default to in-memory
const isLocalhostUnset = !connectionString || connectionString.includes('localhost:5432') || connectionString.includes('127.0.0.1:5432');

if (connectionString && !isLocalhostUnset) {
  function resolveSsl() {
    const explicit = String(process.env.DATABASE_SSL || process.env.PGSSLMODE || '').toLowerCase();
    if (['true', 'require', 'prefer'].includes(explicit)) {
      return { rejectUnauthorized: false };
    }
    if (['false', 'disable'].includes(explicit)) {
      return false;
    }
    // Managed providers usually embed sslmode in the URL.
    if (/[?&]ssl(mode)?=(require|true)/i.test(connectionString)) {
      return { rejectUnauthorized: false };
    }
    return false;
  }

  pool = new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX || 12),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: resolveSsl(),
  });

  pool.on('error', (err) => {
    console.error('[db] unexpected idle client error:', err.message);
  });
} else {
  pool = createInMemoryDb();
}

async function query(text, params) {
  return pool.query(text, params);
}

async function healthCheck() {
  const startedAt = Date.now();
  try {
    const { rows } = await pool.query('SELECT 1 AS ok');
    return { ok: rows[0]?.ok === 1 || rows[0]?.ok === '1' || rows.length > 0, latencyMs: Date.now() - startedAt, inMemory: isInMemory };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - startedAt, error: err.message };
  }
}

async function close() {
  await pool.end();
}

module.exports = { pool, query, healthCheck, close, isInMemory: () => isInMemory };
