import { useEffect, useState } from 'react';
import { AlertTriangle, MapPin, Play, Radio, Users } from 'lucide-react';
import { api } from '../../api';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext.jsx';
import { ErrorState, FreshnessChip, OccupancyIndicator, PageHeader, Skeleton, StatusBadge } from '../../components/ui.jsx';
import { firstName, formatDistance, formatEta, freshness } from '../../lib/format.js';

export default function DriverHome() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [occupancy, setOccupancy] = useState('');
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [useGPS, setUseGPS] = useState(false);
  const connected = useSocket(() => { load(); });

  async function load() {
    try {
      const res = await api('/api/driver/me');
      setData((prev) => {
        if (res.trip && res.trip.id !== prev?.trip?.id) {
          setOccupancy(res.trip.occupancy ?? 0);
        }
        return res;
      });
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function act(path, extra) {
    setBusy(path);
    try {
      await api(path, { method: 'POST', body: JSON.stringify(extra || {}) });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  async function updateOccupancy() {
    if (occupancy === '' || occupancy === null) return;
    const count = parseInt(occupancy, 10);
    if (isNaN(count) || count < 0) {
      setError('Invalid passenger count');
      return;
    }
    await act('/api/driver/trip/occupancy', { passengerCount: count });
  }

  function sendSimulated() {
    return act('/api/driver/trip/location', { useSimulation: true });
  }

  function updateLocation() {
    if (!useGPS) {
      sendSimulated();
      return;
    }
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device. Using simulation.');
      sendSimulated();
      return;
    }
    setBusy('/api/driver/trip/location');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const speedKmh = Number.isFinite(pos.coords.speed) && pos.coords.speed > 0
          ? Math.round(pos.coords.speed * 3.6)
          : 18;
        act('/api/driver/trip/location', {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speedKmh,
        }).finally(() => setBusy(''));
      },
      () => {
        setError('GPS permission denied. Falling back to simulation for this update.');
        sendSimulated().finally(() => setBusy(''));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function triggerEmergency() {
    setBusy('/api/driver/emergency');
    try {
      await act('/api/driver/emergency', { message: 'Emergency alert from driver' });
      setShowEmergencyConfirm(false);
    } finally {
      setBusy('');
    }
  }

  if (!data && !error) return <Skeleton className="h-80 w-full" />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  const { driver, trip, nextStop, etaMinutes } = data;
  const onTrip = trip && ['active', 'delayed'].includes(trip.status);
  const chip = freshness({
    lastUpdate: trip?.updated_at || trip?.started_at,
    calculationMode: etaMinutes == null && onTrip ? 'UNAVAILABLE' : onTrip ? 'LIVE' : 'SCHEDULED',
    connected,
  });

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader
        kicker={`Hello, ${firstName(user?.full_name || driver?.full_name)}`}
        title={onTrip ? 'Live Trip' : 'Driver Dashboard'}
        subtitle={onTrip ? 'Share location, occupancy and delays from this screen.' : 'Ready for your next trip.'}
        actions={<FreshnessChip freshness={onTrip ? chip : { label: connected ? 'Online' : 'Offline', tone: connected ? 'emerald' : 'slate' }} />}
      />

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-slate-500">Assigned bus</p>
          <StatusBadge status={onTrip ? (trip.status === 'active' ? 'on-time' : trip.status) : driver.status} />
        </div>
        <p className="text-3xl font-bold text-ink">{driver.bus_number || 'Unassigned'}</p>
        <p className="mt-2 text-slate-700">Route {driver.route_code} — {driver.route_name}</p>
        <p className="text-sm text-slate-500">{driver.start_name} → {driver.end_name}</p>
        {driver.capacity && <p className="mt-2 text-sm text-slate-600">Capacity {driver.capacity} passengers</p>}
      </section>

      {onTrip && (
        <>
          <section className="overflow-hidden rounded-2xl bg-navy p-5 text-white shadow-sheet">
            <p className="text-sm text-white/70">Next stop</p>
            <p className="mt-1 text-2xl font-semibold">{nextStop?.name || 'Final stop'}</p>
            <p className="mt-1 text-white/75">
              {etaMinutes != null ? formatEta(etaMinutes) : 'ETA unavailable'}
              {trip?.remainingDistanceM != null ? ` · ${formatDistance(trip.remainingDistanceM)}` : ''}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full bg-primary" style={{ width: `${Math.round((trip.progress || 0) * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-white/60">Progress {Math.round((trip.progress || 0) * 100)}%</p>
          </section>

          <section className="card p-5">
            <label className="block">
              <p className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                <Users size={16} aria-hidden="true" /> Current passengers
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max={driver.capacity || 50}
                  value={occupancy}
                  onChange={(e) => setOccupancy(e.target.value)}
                  className="field text-center text-lg font-semibold"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={updateOccupancy}
                  disabled={!!busy}
                  className="btn-ghost"
                >
                  Update
                </button>
              </div>
            </label>
            <div className="mt-3">
              <OccupancyIndicator occupancy={Number(occupancy) || 0} capacity={driver.capacity} level={(Number(occupancy) / (driver.capacity || 1)) > 0.75 ? 'high' : (Number(occupancy) / (driver.capacity || 1)) > 0.4 ? 'medium' : 'low'} />
            </div>
          </section>

          <section className="card p-5">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={useGPS}
                onChange={(e) => setUseGPS(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">Use device GPS when available</span>
            </label>
            <p className="mt-2 text-xs text-slate-500">
              {useGPS ? 'Real GPS enabled (needs permission). Simulator will not overwrite a device fix.' : 'Simulation mode — demo location only.'}
            </p>
          </section>
        </>
      )}

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!onTrip ? (
        <button
          type="button"
          disabled={!!busy}
          onClick={() => act('/api/driver/trip/start')}
          className="flex min-h-16 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-lg font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Play size={20} aria-hidden="true" />
          {busy === '/api/driver/trip/start' ? 'Starting…' : 'Start Trip'}
        </button>
      ) : (
        <div className="grid gap-3">
          <button
            type="button"
            disabled={!!busy}
            onClick={updateLocation}
            className="flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <MapPin size={18} aria-hidden="true" />
            {busy === '/api/driver/trip/location' ? 'Updating…' : 'Update Location'}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!!busy}
              onClick={() => act('/api/driver/trip/delay', { minutes: 5, reason: 'Campus congestion' })}
              className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-amber-500 text-base font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              <Radio size={16} aria-hidden="true" />
              {busy === '/api/driver/trip/delay' ? 'Reporting…' : 'Report Delay'}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => setShowEmergencyConfirm(true)}
              className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-red-600 text-base font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <AlertTriangle size={16} aria-hidden="true" />
              Emergency
            </button>
          </div>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => act('/api/driver/trip/end')}
            className="flex min-h-14 w-full cursor-pointer items-center justify-center rounded-2xl bg-navy text-lg font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {busy === '/api/driver/trip/end' ? 'Ending…' : 'End Trip'}
          </button>
        </div>
      )}

      {showEmergencyConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 md:items-center">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-sheet">
            <h2 className="text-xl font-semibold text-red-700">Emergency Alert</h2>
            <p className="text-slate-700">
              This will immediately notify all administrators. Use only in genuine emergencies.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setShowEmergencyConfirm(false)} className="btn-ghost">
                Cancel
              </button>
              <button type="button" onClick={triggerEmergency} disabled={!!busy} className="btn-danger">
                Confirm Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
