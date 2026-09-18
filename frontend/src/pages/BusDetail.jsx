import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { OccupancyIndicator, StatusBadge, ErrorState, Skeleton, PageHeader } from '../components/ui.jsx';
import { formatEta } from '../lib/format.js';

export default function BusDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api(`/api/buses/${id}`).then(setData).catch((e) => setError(e.message));
  }, [id]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <Skeleton className="h-40 w-full" />;
  const trip = data.trips?.[0];
  return (
    <div className="space-y-4">
      <PageHeader
        title={data.bus.number}
        subtitle={`Capacity ${data.bus.capacity} · Driver ${data.bus.driver_name || 'Unassigned'}`}
        actions={<StatusBadge status={data.bus.status} />}
      />
      {trip && (
        <section className="card p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Latest trip</p>
            <StatusBadge status={trip.status === 'active' ? 'on-time' : trip.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">Route {trip.route_code}</p>
          {trip.occupancy != null && (
            <div className="mt-3">
              <OccupancyIndicator occupancy={trip.occupancy} capacity={data.bus.capacity} level={trip.occupancy / data.bus.capacity > 0.75 ? 'high' : trip.occupancy / data.bus.capacity > 0.4 ? 'medium' : 'low'} />
            </div>
          )}
          {trip.etaMinutes != null && <p className="mt-2 text-sm text-slate-600">ETA {formatEta(trip.etaMinutes)}</p>}
          <button type="button" onClick={() => navigate('/track', { state: { busId: data.bus.id } })} className="btn-blue mt-4 w-full">
            Track Bus (Live)
          </button>
        </section>
      )}
      <h2 className="font-semibold">Recent trips</h2>
      <ul className="space-y-2">
        {data.trips.map((t) => (
          <li key={t.id} className="card flex items-center justify-between p-3 text-sm">
            <span>{t.route_code}</span>
            <StatusBadge status={t.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
