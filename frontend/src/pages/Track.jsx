import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import { useSocket } from '../hooks/useSocket';
import MapView from '../components/MapView.jsx';
import { OccupancyIndicator, StatusBadge, ErrorState, Skeleton, EmptyState } from '../components/ui.jsx';

export default function Track() {
  const location = useLocation();
  const [buses, setBuses] = useState([]);
  const [selectedId, setSelectedId] = useState(location.state?.busId || null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const live = useSocket((payload) => {
    if (payload?.buses) setBuses(payload.buses);
  });

  async function load() {
    setLoading(true);
    try {
      const res = await api('/api/tracking/active');
      setBuses(res.buses);
      if (!selectedId && res.buses[0]) setSelectedId(res.buses[0].busId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  const selected = buses.find((b) => b.busId === selectedId) || buses[0];
  const stops = selected?.stops || [];
  const path = selected?.path || [];

  const lastUpdate = useMemo(() => {
    if (!selected?.lastUpdate) return 'just now';
    const diff = Math.round((Date.now() - new Date(selected.lastUpdate).getTime()) / 1000);
    if (diff < 10) return 'just now';
    return `${diff}s ago`;
  }, [selected]);

  if (loading) return <Skeleton className="h-[70vh] w-full" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!buses.length) return <EmptyState title="No live trips" body="Start a driver trip to see movement on the map." />;

  return (
    <div className="flex min-h-[70vh] flex-col gap-4 lg:flex-row">
      <div className="h-[52vh] min-h-[320px] flex-1 overflow-hidden rounded-2xl border border-line lg:h-[calc(100dvh-8rem)]">
        <MapView buses={buses} stops={stops} path={path} selectedId={selected?.busId} onSelect={(b) => setSelectedId(b.busId)} />
      </div>
      {selected && (
        <aside className="rounded-2xl border border-line bg-white p-5 shadow-sheet lg:w-96">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">{selected.busNumber}</h1>
            <StatusBadge status={selected.status === 'active' ? 'on-time' : selected.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">Route {selected.routeCode} · {selected.routeName}</p>
          <p className="mt-4 text-3xl font-semibold">{Math.max(1, Math.round(selected.etaMinutes))} min</p>
          <p className="text-sm text-slate-600">to {selected.nextStop?.name || 'end of route'}</p>
          <div className="mt-4">
            <OccupancyIndicator level={selected.crowd} occupancy={selected.occupancy} capacity={selected.capacity} />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-primary" style={{ width: `${Math.round((selected.progress || 0) * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">Trip progress {Math.round((selected.progress || 0) * 100)}% · Updated {lastUpdate} {live ? '· live' : ''}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {stops.map((stop, idx) => (
              <li key={stop.id} className={`flex items-center justify-between rounded-xl px-3 py-2 ${idx === selected.currentStopIndex ? 'bg-muted font-medium' : ''}`}>
                <span>{stop.name}</span>
                {idx === selected.currentStopIndex + 1 && <span className="text-primary">Next</span>}
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
