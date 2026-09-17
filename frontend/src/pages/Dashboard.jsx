import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MapPin, Clock, Users } from 'lucide-react';
import { api } from '../api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext.jsx';
import BusCard from '../components/BusCard.jsx';
import RouteCard from '../components/RouteCard.jsx';
import { EmptyState, ErrorState, Skeleton, StatusBadge } from '../components/ui.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
  useSocket((payload) => {
    if (payload?.buses) {
      const sorted = [...payload.buses].sort((a, b) => (a.etaMinutes ?? Infinity) - (b.etaMinutes ?? Infinity));
      setData((prev) => prev ? { ...prev, activeBuses: payload.buses, nextBus: sorted[0] || null } : prev);
    }
  });

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

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">Welcome back, {user?.full_name?.split(' ')[0]}</p>
          <h1 className="text-3xl font-bold text-slate-900">My Bus</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell size={20} className="text-slate-700" />
        </button>
      </header>

      {/* Primary: Pickup Point Card */}
      {pickupStop ? (
        <section className="rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-700">Your pickup point</p>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{pickupStop.name}</h2>
          <p className="text-sm text-slate-600 mt-2">{pickupStop.description || 'Your preferred bus stop'}</p>

          {busesAtStop.length > 0 ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase">Buses serving this stop</p>
              {busesAtStop.slice(0, 2).map((bus) => (
                <div
                  key={bus.tripId}
                  onClick={() => navigate('/track', { state: { busId: bus.busId } })}
                  className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-200 hover:border-blue-400 cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Bus {bus.busNumber}</p>
                    <p className="text-xs text-slate-600">Route {bus.routeCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">
                      {bus.etaMinutes != null ? `${Math.round(bus.etaMinutes)}m` : '—'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {bus.occupancy}/{bus.capacity} passengers
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 p-3 rounded-lg bg-slate-100">
              <p className="text-sm text-slate-600">No active buses for this stop right now</p>
            </div>
          )}

          <button
            onClick={() => navigate('/stops')}
            className="mt-4 w-full text-sm font-medium text-blue-600 hover:text-blue-700 py-2"
          >
            Change pickup point →
          </button>
        </section>
      ) : (
        <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-900">No pickup point selected</p>
          <p className="text-sm text-amber-800 mt-1">Choose your preferred pickup stop to see live buses</p>
          <button
            onClick={() => navigate('/stops')}
            className="mt-3 w-full rounded-lg bg-amber-600 text-white font-medium py-2 hover:bg-amber-700"
          >
            Select Pickup Point
          </button>
        </section>
      )}

      {/* Service Announcements */}
      {announcements.length > 0 && (
        <section className="rounded-2xl border-l-4 border-l-amber-500 bg-amber-50 p-4 border border-amber-200">
          <h3 className="text-sm font-bold text-amber-900">Service Updates</h3>
          <div className="mt-3 space-y-2">
            {announcements.slice(0, 2).map((ann) => (
              <div key={ann.id} className="text-sm text-amber-900">
                <p className="font-medium">{ann.title}</p>
                <p className="text-amber-800 mt-0.5">{ann.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Active Buses */}
      {data.activeBuses && data.activeBuses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900">All Active Buses</h2>
            <span className="text-sm text-slate-500">{data.activeBuses.length} live</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {data.activeBuses.map((bus) => (
              <div
                key={bus.tripId}
                onClick={() => navigate('/track', { state: { busId: bus.busId } })}
                className="rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-slate-900">Bus {bus.busNumber}</p>
                    <p className="text-xs text-slate-600">Route {bus.routeCode}</p>
                  </div>
                  <StatusBadge status={bus.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div>
                    <Clock className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                    <p className="text-sm font-semibold text-slate-900">{bus.etaMinutes != null ? `${Math.round(bus.etaMinutes)}m` : '—'}</p>
                    <p className="text-xs text-slate-500">ETA</p>
                  </div>
                  <div>
                    <Users className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                    <p className="text-sm font-semibold text-slate-900">{bus.occupancy}</p>
                    <p className="text-xs text-slate-500">of {bus.capacity}</p>
                  </div>
                  <div>
                    <MapPin className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                    <p className="text-sm font-semibold text-slate-900">{Math.round((bus.progress || 0) * 100)}%</p>
                    <p className="text-xs text-slate-500">Progress</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Routes Section */}
      {data.routes && data.routes.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">Available Routes</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {data.routes.map((route) => (
              <div
                key={route.id}
                onClick={() => navigate(`/routes/${route.id}`)}
                className="rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
              >
                <p className="text-lg font-bold text-slate-900">{route.name}</p>
                <p className="text-sm text-slate-600 mt-1">{route.stops?.length || 0} stops</p>
                <p className="text-xs text-slate-500 mt-2">{route.start_name} → {route.end_name}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
