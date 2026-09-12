import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useSocket } from '../../hooks/useSocket';
import { ErrorState, Skeleton, StatusBadge } from '../../components/ui.jsx';

export default function DriverHome() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [occupancy, setOccupancy] = useState('');
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [useGPS, setUseGPS] = useState(false);

  async function load() {
    try {
      const res = await api('/api/driver/me');
      setData(res);
      if (res.trip) setOccupancy(res.trip.occupancy || 0);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, []);
  useSocket(() => { load(); });

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

  async function updateLocation() {
    setBusy('/api/driver/trip/location');
    try {
      if (useGPS && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            act('/api/driver/trip/location', {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              speedKmh: pos.coords.speed || 18,
            });
          },
          () => {
            setError('GPS permission denied, using simulation');
            act('/api/driver/trip/location', { useSimulation: true });
          }
        );
      } else {
        await act('/api/driver/trip/location', { useSimulation: true });
      }
    } finally {
      setBusy('');
    }
  }

  async function triggerEmergency() {
    if (!window.confirm('Are you sure? This will alert all administrators immediately.')) return;
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

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Driver Trip Control</h1>
      
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex justify-between mb-3">
          <p className="text-sm text-slate-500">Assigned bus</p>
          <StatusBadge status={onTrip ? trip.status : driver.status} />
        </div>
        <p className="text-3xl font-bold text-slate-900">{driver.bus_number || 'Unassigned'}</p>
        <p className="mt-2 text-slate-700">Route {driver.route_code} — {driver.route_name}</p>
        <p className="text-sm text-slate-500">{driver.start_name} → {driver.end_name}</p>
        {driver.capacity && <p className="mt-2 text-sm text-slate-600">Capacity: {driver.capacity} passengers</p>}
      </section>

      {onTrip && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500 mb-2">Next stop</p>
            <p className="text-xl font-semibold text-slate-900">{nextStop?.name || 'Final stop'}</p>
            {etaMinutes != null && (
              <p className="text-slate-600 mt-1">{Math.round(etaMinutes)} min away</p>
            )}
            {trip && <p className="mt-3 text-sm text-slate-600">Progress: {Math.round((trip.progress || 0) * 100)}%</p>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block mb-3">
              <p className="text-sm text-slate-500 mb-2">Current passengers</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max={driver.capacity || 50}
                  value={occupancy}
                  onChange={(e) => setOccupancy(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center"
                  placeholder="0"
                />
                <button
                  onClick={updateOccupancy}
                  disabled={!!busy}
                  className="rounded-lg bg-slate-200 px-4 py-2 font-medium text-slate-800 disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </label>
            <p className="text-xs text-slate-500">{occupancy} / {driver.capacity || '?'}</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={useGPS}
                onChange={(e) => setUseGPS(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Use device GPS (if available)</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              {useGPS ? 'Real GPS enabled (needs permission)' : 'Using simulation mode'}
            </p>
          </section>
        </>
      )}

      {error && <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{error}</p>}

      {!onTrip ? (
        <button
          disabled={!!busy}
          onClick={() => act('/api/driver/trip/start')}
          className="min-h-14 w-full cursor-pointer rounded-2xl bg-emerald-600 text-lg font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === '/api/driver/trip/start' ? 'Starting...' : 'Start Trip'}
        </button>
      ) : (
        <div className="grid gap-3">
          <button
            disabled={!!busy}
            onClick={updateLocation}
            className="min-h-12 w-full cursor-pointer rounded-2xl bg-blue-600 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === '/api/driver/trip/location' ? 'Updating...' : 'Update Location'}
          </button>

          <button
            disabled={!!busy}
            onClick={() => act('/api/driver/trip/delay', { minutes: 5, reason: 'Campus congestion' })}
            className="min-h-12 w-full cursor-pointer rounded-2xl bg-amber-600 text-lg font-semibold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === '/api/driver/trip/delay' ? 'Reporting...' : 'Report Delay'}
          </button>

          <button
            disabled={!!busy}
            onClick={() => setShowEmergencyConfirm(true)}
            className="min-h-12 w-full cursor-pointer rounded-2xl bg-red-600 text-lg font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🚨 Emergency Alert
          </button>

          <button
            disabled={!!busy}
            onClick={() => act('/api/driver/trip/end')}
            className="min-h-12 w-full cursor-pointer rounded-2xl bg-slate-900 text-lg font-semibold text-white hover:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === '/api/driver/trip/end' ? 'Ending...' : 'End Trip'}
          </button>
        </div>
      )}

      {showEmergencyConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-xl font-semibold text-red-700">⚠️ Emergency Alert</h2>
            <p className="text-slate-700">
              This will immediately notify all administrators. Use only in genuine emergencies.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowEmergencyConfirm(false)}
                className="rounded-lg border border-slate-300 py-2 font-medium text-slate-800 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={triggerEmergency}
                disabled={!!busy}
                className="rounded-lg bg-red-600 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
