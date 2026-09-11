import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { StatusBadge, ErrorState, Skeleton } from '../components/ui.jsx';

export default function BusDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api(`/api/buses/${id}`).then(setData).catch((e) => setError(e.message));
  }, [id]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{data.bus.number}</h1>
      <StatusBadge status={data.bus.status} />
      <p>Capacity {data.bus.capacity} · Driver {data.bus.driver_name || 'Unassigned'}</p>
      <h2 className="font-semibold">Recent trips</h2>
      <ul className="space-y-2">
        {data.trips.map((t) => (
          <li key={t.id} className="rounded-xl border border-line bg-white p-3 text-sm">{t.route_code} · {t.status}</li>
        ))}
      </ul>
    </div>
  );
}
