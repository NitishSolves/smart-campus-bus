import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useSocket } from '../../hooks/useSocket';
import { ErrorState, Skeleton, StatusBadge } from '../../components/ui.jsx';

export default function DriverHome() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  async function load() {
    try {
      const res = await api('/api/driver/me');
      setData(res);
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

  if (!data && !error) return <Skeleton className="h-80 w-full" />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  const { driver, trip, nextStop, etaMinutes } = data;
  const onTrip = trip && ['active', 'delayed'].includes(trip.status);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Driver trip</h1>
      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="flex justify-between">
          <p className="text-sm text-slate-500">Assigned bus</p>
          <StatusBadge status={onTrip ? trip.status : driver.status} />
        </div>
        <p className="text-3xl font-semibold">{driver.bus_number || 'Unassigned'}</p>
        <p className="mt-2 text-slate-700">Route {driver.route_code} · {driver.route_name}</p>
        <p className="text-sm text-slate-500">{driver.start_name} to {driver.end_name}</p>
      </section>
      <section className="rounded-2xl border border-line bg-white p-5">
        <p className="text-sm text-slate-500">Next stop</p>
        <p className="text-xl font-semibold">{nextStop?.name || 'Start trip to begin'}</p>
        {etaMinutes != null && <p className="text-slate-600">{Math.round(etaMinutes)} min · occupancy {trip?.occupancy || 0}</p>}
        {onTrip && <p className="mt-2 text-sm">Progress {Math.round((trip.progress || 0) * 100)}%</p>}
      </section>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!onTrip ? (
        <button disabled={!!busy} onClick={() => act('/api/driver/trip/start')} className="min-h-14 w-full cursor-pointer rounded-2xl bg-primary text-lg font-semibold text-white disabled:opacity-50">
          Start Trip
        </button>
      ) : (
        <div className="grid gap-3">
          <button disabled={!!busy} onClick={() => act('/api/driver/trip/location')} className="min-h-14 w-full cursor-pointer rounded-2xl bg-secondary text-lg font-semibold text-white disabled:opacity-50">
            Update Location
          </button>
          <button disabled={!!busy} onClick={() => act('/api/driver/trip/delay', { minutes: 4, reason: 'Campus congestion' })} className="min-h-14 w-full cursor-pointer rounded-2xl bg-amber-500 text-lg font-semibold text-white disabled:opacity-50">
            Report Delay
          </button>
          <button disabled={!!busy} onClick={() => act('/api/driver/trip/end')} className="min-h-14 w-full cursor-pointer rounded-2xl bg-slate-900 text-lg font-semibold text-white disabled:opacity-50">
            End Trip
          </button>
        </div>
      )}
    </div>
  );
}
