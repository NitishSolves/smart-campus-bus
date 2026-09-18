import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, MapPin, Users } from 'lucide-react';
import { api } from '../api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorState, FreshnessChip, IconButton, PageHeader, Skeleton, StatusBadge } from '../components/ui.jsx';
import { firstName, formatEtaShort, freshness } from '../lib/format.js';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const connected = useSocket((payload) => {
    if (payload?.buses) {
      const sorted = [...payload.buses].sort((a, b) => (a.etaMinutes ?? Infinity) - (b.etaMinutes ?? Infinity));
      setData((prev) => (prev ? { ...prev, activeBuses: payload.buses, nextBus: sorted[0] || null } : prev));
    }
  });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [dashRes, annRes] = await Promise.all([
        api('/api/dashboard'),
        api('/api/notifications/announcements'),
      ]);
      setData(dashRes);
      setAnnouncements(annRes.announcements || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <EmptyState title="No data" body="Dashboard is unavailable right now." />;

  const pickupStop = data.favoriteStop;
  const busesAtStop = (data.activeBuses || [])
    .filter((b) => pickupStop && (b.stops || []).some((s) => s.id === pickupStop.id))
    .sort((a, b) => (a.etaMinutes ?? Infinity) - (b.etaMinutes ?? Infinity));
  const nextBus = busesAtStop[0] || data.nextBus;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={`Welcome back, ${firstName(user?.full_name)}`}
        title="My Bus"
        subtitle="Live campus buses for your pickup point."
        actions={<IconButton label="Notifications" onClick={() => navigate('/notifications')}><Bell size={20} /></IconButton>}
      />

      {pickupStop ? (
        <section className="overflow-hidden rounded-2xl bg-navy p-5 text-white shadow-sheet">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Your pickup point
            </div>
            {nextBus ? <FreshnessChip freshness={freshness({ lastUpdate: nextBus.lastUpdate, calculationMode: nextBus.calculationMode, connected })} /> : null}
          </div>
          <h2 className="mt-2 text-2xl font-bold">{pickupStop.name}</h2>
          <p className="mt-1 text-sm text-white/70">{pickupStop.description || 'Your preferred bus stop'}</p>

          {busesAtStop.length > 0 ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Next buses</p>
              {busesAtStop.slice(0, 2).map((bus) => (
                <button
                  key={bus.tripId}
                  type="button"
                  onClick={() => navigate('/track', { state: { busId: bus.busId } })}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-white/10 p-3 text-left hover:bg-white/15"
                >
                  <div>
                    <p className="font-semibold">Bus {bus.busNumber}</p>
                    <p className="text-xs text-white/70">Route {bus.routeCode} · {bus.routeName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatEtaShort(bus.etaMinutes)}</p>
                    <p className="text-xs text-white/70">{bus.occupancy}/{bus.capacity} aboard</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-white/10 p-3 text-sm text-white/80">
              No active buses for this stop right now.
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('/stops')}
            className="mt-4 text-sm font-medium text-white/80 hover:text-white"
          >
            Change pickup point
          </button>
        </section>
      ) : (
        <section className="card border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-900">No pickup point selected</p>
          <p className="mt-1 text-sm text-amber-800">Choose your preferred pickup stop to see live buses.</p>
          <button type="button" onClick={() => navigate('/stops')} className="btn-accent mt-3 w-full">
            Select Pickup Point
          </button>
        </section>
      )}

      {announcements.length > 0 && (
        <section className="rounded-2xl border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50 p-4">
          <h3 className="text-sm font-bold text-amber-900">Service Updates</h3>
          <div className="mt-3 space-y-2">
            {announcements.slice(0, 2).map((ann) => (
              <div key={ann.id} className="text-sm text-amber-900">
                <p className="font-medium">{ann.title}</p>
                <p className="mt-0.5 text-amber-800">{ann.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.activeBuses && data.activeBuses.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">All Active Buses</h2>
            <span className="text-sm text-slate-500">{data.activeBuses.length} live</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {data.activeBuses.map((bus) => (
              <button
                key={bus.tripId}
                type="button"
                onClick={() => navigate('/track', { state: { busId: bus.busId } })}
                className="card cursor-pointer p-4 text-left transition hover:border-primary/40"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-bold text-ink">Bus {bus.busNumber}</p>
                    <p className="text-xs text-slate-600">Route {bus.routeCode}</p>
                  </div>
                  <StatusBadge status={bus.status === 'active' ? 'on-time' : bus.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <Clock className="mx-auto mb-1 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <p className="text-sm font-semibold text-ink">{formatEtaShort(bus.etaMinutes)}</p>
                    <p className="text-xs text-slate-500">ETA</p>
                  </div>
                  <div>
                    <Users className="mx-auto mb-1 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <p className="text-sm font-semibold text-ink">{bus.occupancy}</p>
                    <p className="text-xs text-slate-500">of {bus.capacity}</p>
                  </div>
                  <div>
                    <MapPin className="mx-auto mb-1 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <p className="text-sm font-semibold text-ink">{Math.round((bus.progress || 0) * 100)}%</p>
                    <p className="text-xs text-slate-500">Progress</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {data.routes && data.routes.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-ink">Available Routes</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {data.routes.map((route) => (
              <button
                key={route.id}
                type="button"
                onClick={() => navigate(`/routes/${route.id}`)}
                className="card cursor-pointer p-4 text-left transition hover:border-primary/40"
              >
                <p className="text-lg font-bold text-ink">{route.name}</p>
                <p className="mt-1 text-sm text-slate-600">{route.stops?.length || 0} stops</p>
                <p className="mt-2 text-xs text-slate-500">{route.start_name} → {route.end_name}</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
