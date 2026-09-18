import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Route } from 'lucide-react';
import { api } from '../api';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui.jsx';

const icons = { bus: Bus, route: Route, stop: MapPin };

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function load() {
    try {
      const d = await api('/api/favorites');
      setFavorites(d.favorites);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!favorites.length) return <EmptyState title="No favorites yet" body="Save a route, stop or bus from its details page." />;

  return (
    <div className="space-y-3">
      <PageHeader title="Favorites" subtitle="Quick access to saved buses, routes and stops." />
      {favorites.map((fav) => {
        const Icon = icons[fav.target_type] || Route;
        return (
          <div key={fav.id} className="card flex items-center justify-between p-4">
            <button
              type="button"
              className="flex min-w-0 cursor-pointer items-center gap-3 text-left"
              onClick={() => {
                if (fav.target_type === 'route') navigate(`/routes/${fav.target_id}`);
                if (fav.target_type === 'stop') navigate(`/stops/${fav.target_id}`);
                if (fav.target_type === 'bus') navigate(`/buses/${fav.target_id}`);
              }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <p className="text-xs uppercase text-slate-500">{fav.target_type}</p>
                <p className="truncate font-semibold">{fav.target?.name || fav.target?.code || fav.target?.number || 'Saved item'}</p>
              </span>
            </button>
            <button
              type="button"
              className="min-h-11 cursor-pointer text-sm font-medium text-red-700"
              onClick={async () => { await api(`/api/favorites/${fav.id}`, { method: 'DELETE' }); load(); }}
            >
              Remove
            </button>
          </div>
        );
      })}
    </div>
  );
}
