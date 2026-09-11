import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { EmptyState, ErrorState, Skeleton } from '../components/ui.jsx';

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
      <h1 className="text-2xl font-semibold">Favorites</h1>
      {favorites.map((fav) => (
        <div key={fav.id} className="flex items-center justify-between rounded-2xl border border-line bg-white p-4">
          <button type="button" className="cursor-pointer text-left" onClick={() => {
            if (fav.target_type === 'route') navigate(`/routes/${fav.target_id}`);
            if (fav.target_type === 'stop') navigate(`/stops/${fav.target_id}`);
            if (fav.target_type === 'bus') navigate(`/buses/${fav.target_id}`);
          }}>
            <p className="text-xs uppercase text-slate-500">{fav.target_type}</p>
            <p className="font-semibold">{fav.target?.name || fav.target?.code || fav.target?.number || 'Saved item'}</p>
          </button>
          <button type="button" className="min-h-11 cursor-pointer text-sm text-red-700" onClick={async () => { await api(`/api/favorites/${fav.id}`, { method: 'DELETE' }); load(); }}>Remove</button>
        </div>
      ))}
    </div>
  );
}
