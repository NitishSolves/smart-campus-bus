const { remainingDistanceToStop, haversineMeters } = require('./geo');

const DEFAULT_SPEED_KMH = 9;
const MAX_SPEED_KMH = 80;
const STALE_LOCATION_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const ROUTE_MATCH_TOLERANCE_M = 400;
const ARRIVED_DISTANCE_M = 35;

function isValidPoint(point) {
  if (!point) return false;
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false; // treat null-island as "no location"
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  return true;
}

function sanitizeSpeed(speedKmh) {
  const speed = Number(speedKmh);
  if (!Number.isFinite(speed) || speed <= 0.5) return DEFAULT_SPEED_KMH;
  if (speed > MAX_SPEED_KMH) return MAX_SPEED_KMH;
  return speed;
}

function minutesFromDistance(meters, speedKmh) {
  const speed = sanitizeSpeed(speedKmh);
  const speedMs = speed / 3.6;
  return meters / speedMs / 60;
}

function blendEtaMinutes({ distanceM, speedKmh, historicalSeconds, delayMinutes }) {
  const live = minutesFromDistance(distanceM, speedKmh);
  const hist = historicalSeconds ? historicalSeconds / 60 : live;
  const blended = live * 0.65 + hist * 0.35;
  return Math.max(0, Math.round((blended + (delayMinutes || 0)) * 10) / 10);
}

function minDistanceToPath(point, path) {
  let best = Infinity;
  for (const vertex of path) {
    const d = haversineMeters(point, vertex);
    if (d < best) best = d;
  }
  return best;
}

function unavailable(lastLocationTime, extra = {}) {
  return {
    available: false,
    etaMinutes: null,
    remainingDistanceM: null,
    calculationMode: 'UNAVAILABLE',
    isStale: false,
    routeMismatch: false,
    lastUpdated: lastLocationTime || null,
    ...extra,
  };
}

function computeStopEta({ point, path, stop, speedKmh, historicalSeconds, delayMinutes, lastLocationTime, tripStatus }) {
  if (!isValidPoint(point) || !isValidPoint(stop)) {
    return unavailable(lastLocationTime);
  }

  const hasPath = Array.isArray(path) && path.length > 0;
  const distanceM = hasPath
    ? remainingDistanceToStop(point, path, stop)
    : haversineMeters(point, stop);

  if (!Number.isFinite(distanceM) || distanceM < 0) {
    return unavailable(lastLocationTime);
  }

  const isLocationStale = lastLocationTime
    ? Date.now() - new Date(lastLocationTime).getTime() > STALE_LOCATION_THRESHOLD_MS
    : false;

  // The stop should sit on the route path. If it does not, the remaining
  // distance is unreliable and we label the prediction as a fallback.
  const routeMismatch = hasPath ? minDistanceToPath(stop, path) > ROUTE_MATCH_TOLERANCE_M : false;

  if (distanceM <= ARRIVED_DISTANCE_M) {
    return {
      available: true,
      etaMinutes: 0,
      remainingDistanceM: Math.round(distanceM),
      calculationMode: 'ARRIVED',
      isStale: isLocationStale,
      routeMismatch,
      lastUpdated: lastLocationTime || null,
    };
  }

  const effectiveSpeed = isLocationStale ? DEFAULT_SPEED_KMH : speedKmh;
  const rawEta = blendEtaMinutes({ distanceM, speedKmh: effectiveSpeed, historicalSeconds, delayMinutes });

  if (!Number.isFinite(rawEta)) {
    return unavailable(lastLocationTime, { routeMismatch, isStale: isLocationStale });
  }

  let calculationMode = 'LIVE';
  if (isLocationStale) calculationMode = 'DEGRADED';
  else if (routeMismatch) calculationMode = 'ROUTE_FALLBACK';
  else if (tripStatus === 'scheduled') calculationMode = 'SCHEDULED';

  return {
    available: true,
    etaMinutes: Math.max(0, rawEta),
    remainingDistanceM: Math.round(Math.max(0, distanceM)),
    calculationMode,
    isStale: isLocationStale,
    routeMismatch,
    lastUpdated: lastLocationTime || null,
  };
}

module.exports = {
  minutesFromDistance,
  blendEtaMinutes,
  computeStopEta,
  sanitizeSpeed,
  isValidPoint,
  DEFAULT_SPEED_KMH,
  STALE_LOCATION_THRESHOLD_MS,
  ROUTE_MATCH_TOLERANCE_M,
  ARRIVED_DISTANCE_M,
};
