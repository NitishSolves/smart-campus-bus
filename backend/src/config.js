const SUPPORTED_ENVS = ['development', 'production', 'test'];

function readEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const rawPort = process.env.PORT;
  const port = rawPort === undefined || rawPort === '' ? 3001 : Number(rawPort);

  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    port,
    databaseUrl: process.env.DATABASE_URL || '',
    jwtSecret: process.env.JWT_SECRET || '',
    corsOrigins: (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}

function validateEnv(env = readEnv()) {
  const problems = [];

  if (!env.databaseUrl) {
    problems.push('DATABASE_URL is required (see backend/.env.example)');
  } else if (!/^postgres(ql)?:\/\//i.test(env.databaseUrl)) {
    problems.push('DATABASE_URL must be a valid postgres:// connection string');
  }

  if (!env.jwtSecret) {
    problems.push('JWT_SECRET is required (see backend/.env.example)');
  } else if (env.isProduction && env.jwtSecret.length < 16) {
    problems.push('JWT_SECRET must be at least 16 characters in production');
  }

  if (!SUPPORTED_ENVS.includes(env.nodeEnv)) {
    problems.push(`NODE_ENV must be one of: ${SUPPORTED_ENVS.join(', ')}`);
  }

  if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
    problems.push('PORT must be an integer between 1 and 65535');
  }

  return { env, problems };
}

module.exports = { readEnv, validateEnv, SUPPORTED_ENVS };
