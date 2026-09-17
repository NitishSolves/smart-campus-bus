import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui.jsx';

export default function StopsPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [stops, setStops] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api('/api/stops');
      setStops(res.stops || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function setPickup(stopId) {
    setSavingId(stopId);
    try {
      const res = await api('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ defaultStopId: stopId }),
      });
      setUser(res.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId('');
    }
  }

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error && !stops.length) return <ErrorState message={error} onRetry={load} />;
  if (!stops.length) return <EmptyState title="No stops yet" body="An administrator has not added campus stops." />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Choose pickup point</h1>
      <p className="text-sm text-slate-600">Buses serving your pickup point appear first on your dashboard.</p>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {stops.map((stop) => {
          const active = stop.id === user?.default_stop_id;
          return (
            <li key={stop.id}>
              <button
                type="button"
                onClick={() => setPickup(stop.id)}
                disabled={savingId === stop.id}
                className={`flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border bg-white p-4 text-left transition ${
                  active ? 'border-primary ring-1 ring-primary/30' : 'border-line hover:border-primary/40'
                } disabled:opacity-60`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <MapPin size={18} className="shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{stop.name}</span>
                    {stop.description && <span className="block truncate text-xs text-slate-500">{stop.description}</span>}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium text-primary">
                  {savingId === stop.id ? 'Saving…' : active ? 'Selected' : 'Select'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
