import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { api } from '../api';
import MapView from '../components/MapView.jsx';
import { OccupancyIndicator, StatusBadge, ErrorState, Skeleton } from '../components/ui.jsx';

export default function RouteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/api/routes/${id}`).then(setData).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <ErrorState message={error} />;
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
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm"
          onClick={() => api('/api/favorites', { method: 'POST', body: JSON.stringify({ targetType: 'route', targetId: route.id }) })}
        >
          <Star size={16} /> Save
        </button>
      </div>
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
          <p className="font-semibold">{t.bus_number} is on this route</p>
          <OccupancyIndicator level="medium" occupancy={t.occupancy} capacity={40} />
        </div>
      ))}
    </div>
  );
}
