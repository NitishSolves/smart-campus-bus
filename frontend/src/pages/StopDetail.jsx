import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { api } from '../api';
import MapView from '../components/MapView.jsx';
import { OccupancyIndicator, ErrorState, Skeleton, EmptyState, PageHeader } from '../components/ui.jsx';
import { formatEta } from '../lib/format.js';

export default function StopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api(`/api/stops/${id}`).then(setData).catch((e) => setError(e.message));
  }, [id]);

  async function saveFavorite() {
    try {
      await api('/api/favorites', { method: 'POST', body: JSON.stringify({ targetType: 'stop', targetId: id }) });
      setSaved(true);
    } catch (e) {
      setError(e.message);
    }
  }

  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <Skeleton className="h-48 w-full" />;

  const stopPoint = data.stop?.lat != null ? [data.stop] : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title={data.stop.name}
        subtitle={data.stop.description || `Serving ${data.routes.map((r) => r.code).join(', ') || 'no routes'}`}
        actions={(
          <button type="button" className="btn-ghost disabled:opacity-60" onClick={saveFavorite} disabled={saved}>
            <Star size={16} aria-hidden="true" /> {saved ? 'Saved' : 'Add to favorites'}
          </button>
        )}
      />
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      {stopPoint.length > 0 && (
        <div className="h-52 overflow-hidden rounded-2xl border border-line">
          <MapView stops={stopPoint} buses={[]} />
        </div>
      )}
      <h2 className="font-semibold">Buses arriving</h2>
      {!data.upcoming.length && <EmptyState title="None approaching" body="No active trip is heading here right now." />}
      <div className="space-y-3">
        {data.upcoming.map((u) => (
          <button key={u.tripId} type="button" onClick={() => navigate('/track', { state: { busId: u.busId } })} className="card w-full cursor-pointer p-4 text-left">
            <div className="flex justify-between font-semibold">
              <span>{u.busNumber} · Route {u.routeCode}</span>
              <span className="text-primary">{formatEta(u.etaMinutes) || 'ETA unavailable'}</span>
            </div>
            <div className="mt-3">
              <OccupancyIndicator level={u.crowd} occupancy={u.occupancy} capacity={u.capacity} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
