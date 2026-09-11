function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function pathLength(path) {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += haversineMeters(path[i - 1], path[i]);
  }
  return total;
}

function interpolatePath(path, progress) {
  if (!path.length) return { lat: 0, lng: 0, heading: 0, remaining: 0 };
  const clamped = Math.max(0, Math.min(0.999, progress));
  const total = pathLength(path);
  let target = total * clamped;
  let travelled = 0;
  for (let i = 1; i < path.length; i += 1) {
    const seg = haversineMeters(path[i - 1], path[i]);
    if (travelled + seg >= target) {
      const t = seg === 0 ? 0 : (target - travelled) / seg;
      const lat = path[i - 1].lat + (path[i].lat - path[i - 1].lat) * t;
      const lng = path[i - 1].lng + (path[i].lng - path[i - 1].lng) * t;
      const heading = Math.atan2(path[i].lng - path[i - 1].lng, path[i].lat - path[i - 1].lat) * (180 / Math.PI);
      return { lat, lng, heading, remaining: total - target, total };
    }
    travelled += seg;
  }
  const last = path[path.length - 1];
  return { lat: last.lat, lng: last.lng, heading: 0, remaining: 0, total };
}

function nearestStopIndex(point, stops) {
  let best = 0;
  let bestDist = Infinity;
  stops.forEach((stop, idx) => {
    const d = haversineMeters(point, { lat: Number(stop.lat), lng: Number(stop.lng) });
    if (d < bestDist) {
      bestDist = d;
      best = idx;
    }
  });
  return best;
}

function remainingDistanceToStop(point, path, stop) {
  if (!path.length) return haversineMeters(point, stop);
  let minAt = 0;
  let minD = Infinity;
  path.forEach((p, i) => {
    const d = haversineMeters(point, p);
    if (d < minD) {
      minD = d;
      minAt = i;
    }
  });
  let stopAt = path.length - 1;
  let stopD = Infinity;
  path.forEach((p, i) => {
    const d = haversineMeters(p, stop);
    if (d < stopD) {
      stopD = d;
      stopAt = i;
    }
  });
  if (stopAt <= minAt) return haversineMeters(point, stop);
  let rem = haversineMeters(point, path[minAt]);
  for (let i = minAt + 1; i <= stopAt; i += 1) {
    rem += haversineMeters(path[i - 1], path[i]);
  }
  return rem;
}

function crowdLevel(occupancy, capacity) {
  const ratio = capacity > 0 ? occupancy / capacity : 0;
  if (ratio < 0.4) return 'low';
  if (ratio < 0.75) return 'medium';
  return 'high';
}

module.exports = {
  haversineMeters,
  pathLength,
  interpolatePath,
  nearestStopIndex,
  remainingDistanceToStop,
  crowdLevel,
};
