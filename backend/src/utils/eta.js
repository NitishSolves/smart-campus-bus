const { remainingDistanceToStop, haversineMeters } = require('./geo');

const DEFAULT_SPEED_KMH = 9;
const STALE_LOCATION_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function minutesFromDistance(meters, speedKmh) {
  const speedMs = (speedKmh / 3.6);
  if (speedMs <= 0.1) return Math.ceil(meters / 5 / 60);
  return meters / speedMs / 60;
}

function blendEtaMinutes({ distanceM, speedKmh, historicalSeconds, delayMinutes }) {
  const live = minutesFromDistance(distanceM, speedKmh || DEFAULT_SPEED_KMH);
  const hist = historicalSeconds ? historicalSeconds / 60 : live;
  const blended = live * 0.65 + hist * 0.35;
  return Math.max(1, Math.round((blended + (delayMinutes || 0)) * 10) / 10);
}

function computeStopEta({ point, path, stop, speedKmh, historicalSeconds, delayMinutes, lastLocationTime, tripStatus }) {
  const distanceM = path && path.length
    ? remainingDistanceToStop(point, path, stop)
    : haversineMeters(point, stop);
  
  // Determine if location is stale
  const isLocationStale = lastLocationTime 
    ? (Date.now() - new Date(lastLocationTime).getTime()) > STALE_LOCATION_THRESHOLD_MS
    : false;
  
  let calculationMode = 'LIVE';
  let etaMinutes = blendEtaMinutes({
    distanceM,
    speedKmh: isLocationStale ? DEFAULT_SPEED_KMH : speedKmh,
    historicalSeconds,
    delayMinutes,
  });

  if (isLocationStale) {
    calculationMode = 'DEGRADED';
  } else if (tripStatus === 'scheduled' || !speedKmh) {
    calculationMode = 'SCHEDULED';
  }

  // Ensure reasonable ETA values
  if (!isFinite(etaMinutes) || etaMinutes < 0) {
    etaMinutes = Math.max(0, historicalSeconds ? historicalSeconds / 60 : 5);
  }

  return {
    etaMinutes: Math.max(0, etaMinutes),
    remainingDistanceM: Math.round(Math.max(0, distanceM)),
    calculationMode,
    isStale: isLocationStale,
    lastUpdated: lastLocationTime || null,
  };
}

module.exports = {
  minutesFromDistance,
  blendEtaMinutes,
  computeStopEta,
  DEFAULT_SPEED_KMH,
  STALE_LOCATION_THRESHOLD_MS,
};
