import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { api } from '../api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext.jsx';
import BusCard from '../components/BusCard.jsx';
import RouteCard from '../components/RouteCard.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api('/api/dashboard');
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useSocket((payload) => {
    if (payload?.buses) {
      setData((prev) => prev ? { ...prev, activeBuses: payload.buses, nextBus: [...payload.buses].sort((a, b) => a.etaMinutes - b.etaMinutes)[0] || null } : prev);
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

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">Good to go, {user?.full_name?.split(' ')[0]}</p>
          <h1 className="text-2xl font-semibold">Next campus bus</h1>
        </div>
        <button type="button" onClick={() => navigate('/notifications')} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-white" aria-label="Notifications">
          <Bell size={18} />
        </button>
      </header>

      {data.nextBus ? (
        <BusCard bus={data.nextBus} onTrack={(bus) => navigate('/track', { state: { busId: bus.busId } })} />
      ) : (
        <EmptyState title="No active buses" body="A driver has not started a trip yet. Check back shortly." action={<button className="mt-4 min-h-11 rounded-xl bg-primary px-4 text-white" onClick={load}>Refresh</button>} />
      )}

      {data.announcements?.[0] && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-900">Service note</h2>
          <p className="mt-1 text-sm text-amber-900">{data.announcements[0].title} — {data.announcements[0].body}</p>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Active buses</h2>
          <span className="text-sm text-slate-500">{data.activeBuses.length} live</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {data.activeBuses.map((bus) => (
            <BusCard key={bus.tripId} bus={bus} onTrack={() => navigate('/track', { state: { busId: bus.busId } })} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Routes</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {data.routes.map((route) => (
            <RouteCard key={route.id} route={route} onOpen={() => navigate(`/routes/${route.id}`)} />
          ))}
        </div>
      </section>
    </div>
  );
}
