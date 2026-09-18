export function firstName(fullName) {
  const name = String(fullName || '').trim();
  return name.split(/\s+/)[0] || 'there';
}

export function formatEta(minutes) {
  if (minutes == null || !Number.isFinite(Number(minutes))) return null;
  const value = Math.round(Number(minutes));
  if (value <= 0) return 'Arrived';
  return `${value} min`;
}

export function formatEtaShort(minutes) {
  if (minutes == null || !Number.isFinite(Number(minutes))) return '—';
  const value = Math.round(Number(minutes));
  if (value <= 0) return 'Now';
  return `${value}m`;
}

export function formatDistance(meters) {
  if (meters == null || !Number.isFinite(Number(meters))) return null;
  const value = Number(meters);
  if (value < 1000) return `${Math.round(value)} m`;
  return `${(value / 1000).toFixed(1)} km`;
}

export function formatWhen(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export function freshness({ lastUpdate, calculationMode, connected } = {}) {
  if (calculationMode === 'UNAVAILABLE') {
    return { label: 'Unavailable', tone: 'slate', hint: 'Waiting for a GPS fix' };
  }
  if (calculationMode === 'DEGRADED' || calculationMode === 'ROUTE_FALLBACK') {
    return { label: 'Stale', tone: 'amber', hint: 'Using a fallback estimate' };
  }
  if (calculationMode === 'SCHEDULED') {
    return { label: 'Scheduled', tone: 'sky', hint: 'Based on the timetable' };
  }
  if (calculationMode === 'ARRIVED') {
    return { label: 'Arrived', tone: 'emerald', hint: 'At the stop' };
  }
  if (lastUpdate) {
    const diff = Date.now() - new Date(lastUpdate).getTime();
    if (Number.isFinite(diff) && diff > 5 * 60 * 1000) {
      return { label: 'Stale', tone: 'amber', hint: 'No GPS update in 5+ minutes' };
    }
    if (Number.isFinite(diff) && diff > 30 * 1000) {
      return { label: 'Recent', tone: 'sky', hint: 'Updated less than a minute ago' };
    }
  }
  if (connected || calculationMode === 'LIVE') {
    return { label: 'Live', tone: 'emerald', hint: 'Receiving live updates' };
  }
  return { label: 'Recent', tone: 'sky', hint: 'Latest known position' };
}

export function initials(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'U';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
}
