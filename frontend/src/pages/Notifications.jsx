import { useEffect, useState } from 'react';
import { Bell, CircleAlert, Info } from 'lucide-react';
import { api } from '../api';
import { EmptyState, ErrorState, PageHeader, Skeleton, StatusBadge } from '../components/ui.jsx';
import { formatWhen } from '../lib/format.js';

function iconFor(type) {
  if (String(type).includes('delay') || String(type).includes('emergency')) return CircleAlert;
  if (String(type).includes('info') || String(type).includes('announce')) return Info;
  return Bell;
}

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
      <PageHeader title="Notifications" subtitle="Arrival, delay and service notices." />
      {items.map((n) => {
        const Icon = iconFor(n.type);
        const alert = /delay|emergency|warn/.test(String(n.type || n.severity || '').toLowerCase());
        return (
          <article key={n.id} className={`card flex gap-3 p-4 ${alert ? 'border-red-200 bg-red-50' : ''}`}>
            <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${alert ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-primary'}`}>
              <Icon size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase text-slate-500">{n.type}</p>
                {n.severity && <StatusBadge status={n.severity} />}
              </div>
              <h2 className="font-semibold">{n.title}</h2>
              <p className="text-sm text-slate-600">{n.body}</p>
              {n.created_at && <p className="mt-1 text-xs text-slate-400">{formatWhen(n.created_at)}</p>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
