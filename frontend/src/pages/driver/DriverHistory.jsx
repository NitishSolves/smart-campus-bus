import { useEffect, useState } from 'react';
import { api } from '../../api';
import { StatusBadge, Skeleton, EmptyState } from '../../components/ui.jsx';

export default function DriverHistory() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api('/api/driver/history').then((d) => setTrips(d.trips)).finally(() => setLoading(false));
  }, []);
  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!trips.length) return <EmptyState title="No trips yet" body="Completed trips will be stored here." />;
  return (
    <div className="mx-auto max-w-md space-y-3">
      <h1 className="text-2xl font-semibold">Trip history</h1>
      {trips.map((t) => (
        <article key={t.id} className="rounded-2xl border border-line bg-white p-4">
          <div className="flex justify-between">
            <p className="font-semibold">{t.bus_number} · Route {t.route_code}</p>
            <StatusBadge status={t.status} />
          </div>
          <p className="text-sm text-slate-600">{new Date(t.created_at).toLocaleString()}</p>
        </article>
      ))}
    </div>
  );
}
