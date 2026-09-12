const TOKEN_KEY = 'scb_token';

export function getApiBase() {
  const fromEnv = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (import.meta.env.PROD) return 'https://smart-campus-bus.onrender.com/api';
  return '';
}

export function getBackendOrigin() {
  const base = getApiBase();
  if (!base) return '';
  return base.replace(/\/api$/, '');
}

export function apiUrl(path) {
  const base = getApiBase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) return normalizedPath;
  if (base.endsWith('/api') && normalizedPath.startsWith('/api')) {
    return `${base}${normalizedPath.slice(4) || ''}`;
  }
  return `${base}${normalizedPath}`;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(apiUrl(path), { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}
