import { useEffect, useState } from 'react';
import { api } from '../api';
import { EmptyState, ErrorState, Skeleton } from '../components/ui.jsx';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api('/api/notifications').then((d) => setItems(d.notifications)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  if (loading) return <Skeleton className="h-40 w-full" />;
  if (error) return <ErrorState message={error} />;
  if (!items.length) return <EmptyState title="No alerts" body="Arrival, delay and service notices will appear here." />;
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      {items.map((n) => (
        <article key={n.id} className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs uppercase text-slate-500">{n.type}</p>
          <h2 className="font-semibold">{n.title}</h2>
          <p className="text-sm text-slate-600">{n.body}</p>
        </article>
      ))}
    </div>
  );
}
