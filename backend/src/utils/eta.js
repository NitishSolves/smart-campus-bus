const { remainingDistanceToStop, haversineMeters } = require('./geo');

const DEFAULT_SPEED_KMH = 9;

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

function computeStopEta({ point, path, stop, speedKmh, historicalSeconds, delayMinutes }) {
  const distanceM = path && path.length
    ? remainingDistanceToStop(point, path, stop)
    : haversineMeters(point, stop);
  const etaMinutes = blendEtaMinutes({
    distanceM,
    speedKmh,
    historicalSeconds,
    delayMinutes,
  });
  return { etaMinutes, remainingDistanceM: Math.round(distanceM) };
}

module.exports = { minutesFromDistance, blendEtaMinutes, computeStopEta, DEFAULT_SPEED_KMH };
