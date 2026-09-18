import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import { useSocket } from '../hooks/useSocket';
import MapView from '../components/MapView.jsx';
import { OccupancyIndicator, StatusBadge, ErrorState, Skeleton, EmptyState, FreshnessChip, PageHeader } from '../components/ui.jsx';
import { formatDistance, formatEta, freshness } from '../lib/format.js';

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
  const located = buses.filter((b) => b.lat != null && b.lng != null);
  const selected = located.find((b) => b.busId === selectedId) || located[0];
  const stops = selected?.stops || [];
  const path = selected?.path || [];
  const chip = freshness({ lastUpdate: selected?.lastUpdate, calculationMode: selected?.calculationMode, connected: live });

  const lastUpdate = useMemo(() => {
    if (!selected?.lastUpdate) return 'just now';
    const diff = Math.round((Date.now() - new Date(selected.lastUpdate).getTime()) / 1000);
    if (diff < 10) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    return `${Math.round(diff / 60)}m ago`;
  }, [selected]);

  if (loading) return <Skeleton className="h-[70vh] w-full" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!buses.length) return <EmptyState title="No live trips" body="Start a driver trip to see movement on the map." />;

  return (
    <div className="space-y-4">
      <PageHeader title="Live Track" subtitle="Select a bus to follow its route and next stop." />
      <div className="flex min-h-[70vh] flex-col gap-4 lg:flex-row">
        <div className="h-[52vh] min-h-[320px] flex-1 overflow-hidden rounded-2xl border border-line lg:h-[calc(100dvh-10rem)]">
          <MapView buses={located} stops={stops} path={path} selectedId={selected?.busId} onSelect={(b) => setSelectedId(b.busId)} />
        </div>
        {selected && (
          <aside className="card p-5 shadow-sheet lg:w-96">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">{selected.busNumber}</h2>
              <div className="flex flex-wrap justify-end gap-1">
                <StatusBadge status={selected.status === 'active' ? 'on-time' : selected.status} />
                <FreshnessChip freshness={chip} />
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-600">Route {selected.routeCode} · {selected.routeName}</p>
            {selected.etaMinutes != null ? (
              <>
                <p className="mt-4 text-3xl font-semibold">{formatEta(selected.etaMinutes)}</p>
                <p className="text-sm text-slate-600">
                  to {selected.nextStop?.name || 'end of route'}
                  {selected.remainingDistanceM != null ? ` · ${formatDistance(selected.remainingDistanceM)}` : ''}
                </p>
              </>
            ) : (
              <>
                <p className="mt-4 text-2xl font-semibold text-slate-500">ETA unavailable</p>
                <p className="text-sm text-slate-600">Waiting for a fresh GPS fix</p>
              </>
            )}
            <div className="mt-4">
              <OccupancyIndicator level={selected.crowd} occupancy={selected.occupancy} capacity={selected.capacity} />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-primary" style={{ width: `${Math.round((selected.progress || 0) * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Trip progress {Math.round((selected.progress || 0) * 100)}% · Updated {lastUpdate}
              {selected.locationSource === 'device' ? ' · device GPS' : selected.locationSource === 'simulation' ? ' · simulated' : ''}
            </p>
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
    </div>
  );
}
