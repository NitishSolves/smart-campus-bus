import { useEffect, useState } from 'react';
import { api } from '../../api';
import { StatusBadge, Skeleton, EmptyState, ErrorState, PageHeader } from '../../components/ui.jsx';
import { formatWhen } from '../../lib/format.js';

export default function DriverHistory() {
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api('/api/driver/history')
      .then((d) => setTrips(d.trips))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <Skeleton className="h-40 w-full" />;
  if (error) return <ErrorState message={error} />;
  if (!trips.length) return <EmptyState title="No trips yet" body="Completed trips will be stored here." />;
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <PageHeader title="Trip history" subtitle="Past trips and status." />
      {trips.map((t) => (
        <article key={t.id} className="card p-4">
          <div className="flex justify-between gap-3">
            <p className="font-semibold">{t.bus_number} · Route {t.route_code}</p>
            <StatusBadge status={t.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">{formatWhen(t.created_at)}</p>
        </article>
      ))}
    </div>
  );
}
