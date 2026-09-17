import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { api } from '../api';
import MapView from '../components/MapView.jsx';
import { OccupancyIndicator, StatusBadge, ErrorState, Skeleton } from '../components/ui.jsx';

function crowdLevel(occupancy, capacity) {
  const ratio = capacity > 0 ? occupancy / capacity : 0;
  if (ratio < 0.4) return 'low';
  if (ratio < 0.75) return 'medium';
  return 'high';
}

export default function RouteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api(`/api/routes/${id}`).then(setData).catch((e) => setError(e.message));
  }, [id]);

  async function saveFavorite() {
    setError('');
    try {
      await api('/api/favorites', { method: 'POST', body: JSON.stringify({ targetType: 'route', targetId: id }) });
      setSaved(true);
    } catch (e) {
      setError(e.message);
    }
  }

  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <Skeleton className="h-64 w-full" />;
  const { route, demand } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">Route {route.code}</p>
          <h1 className="text-2xl font-semibold">{route.name}</h1>
        </div>
        <button
          type="button"
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm disabled:opacity-60"
          onClick={saveFavorite}
          disabled={saved}
        >
          <Star size={16} /> {saved ? 'Saved' : 'Save'}
        </button>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={route.status} />
        <StatusBadge status={demand.level} />
        <span className="text-sm text-slate-600">{route.duration_minutes} min · predicted {demand.predictedPassengers} riders</span>
      </div>
      <div className="h-64 overflow-hidden rounded-2xl border border-line">
        <MapView stops={route.stops} path={route.path || []} buses={[]} />
      </div>
      <ol className="space-y-2">
        {route.stops.map((stop) => (
          <li key={stop.id}>
            <button type="button" onClick={() => navigate(`/stops/${stop.id}`)} className="flex min-h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-line bg-white px-4 text-left">
              <span>{stop.stop_order}. {stop.name}</span>
              <span className="text-sm text-slate-500">View stop</span>
            </button>
          </li>
        ))}
      </ol>
      {route.activeTrips?.map((t) => (
        <div key={t.id} className="rounded-2xl border border-line bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold">{t.bus_number} is on this route</p>
            <StatusBadge status={t.status} />
          </div>
          <OccupancyIndicator level={crowdLevel(t.occupancy, t.capacity)} occupancy={t.occupancy} capacity={t.capacity} />
        </div>
      ))}
    </div>
  );
}
