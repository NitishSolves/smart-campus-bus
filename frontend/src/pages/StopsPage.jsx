import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui.jsx';

export default function StopsPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [stops, setStops] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [query, setQuery] = useState('');

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

  const filtered = stops.filter((stop) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${stop.name} ${stop.description || ''}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Choose pickup point" subtitle="Buses serving your pickup point appear first on your dashboard." />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search stops…"
        className="field"
        aria-label="Search stops"
      />
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {filtered.map((stop) => {
          const active = stop.id === user?.default_stop_id;
          return (
            <li key={stop.id}>
              <button
                type="button"
                onClick={() => setPickup(stop.id)}
                disabled={savingId === stop.id}
                className={`card flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 p-4 text-left transition ${
                  active ? 'border-primary ring-1 ring-primary/30' : 'hover:border-primary/40'
                } disabled:opacity-60`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
                    <MapPin size={18} aria-hidden="true" />
                  </span>
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
