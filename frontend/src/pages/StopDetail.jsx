import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { OccupancyIndicator, ErrorState, Skeleton, EmptyState } from '../components/ui.jsx';

export default function StopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/api/stops/${id}`).then(setData).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{data.stop.name}</h1>
      <p className="text-sm text-slate-600">{data.stop.description}</p>
      <p className="text-sm">Serving {data.routes.map((r) => r.code).join(', ') || 'no routes'}</p>
      <h2 className="font-semibold">Upcoming buses</h2>
      {!data.upcoming.length && <EmptyState title="None approaching" body="No active trip is heading here right now." />}
      <div className="space-y-3">
        {data.upcoming.map((u) => (
          <button key={u.tripId} type="button" onClick={() => navigate('/track', { state: { busId: u.busId } })} className="w-full cursor-pointer rounded-2xl border border-line bg-white p-4 text-left">
            <div className="flex justify-between font-semibold">
              <span>{u.busNumber} · Route {u.routeCode}</span>
              <span>{u.etaMinutes != null ? `${Math.round(u.etaMinutes)} min` : 'ETA unavailable'}</span>
            </div>
            <OccupancyIndicator level={u.crowd} occupancy={u.occupancy} capacity={u.capacity} />
          </button>
        ))}
      </div>
    </div>
  );
}
