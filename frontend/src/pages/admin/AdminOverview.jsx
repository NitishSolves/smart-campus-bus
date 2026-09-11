import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useSocket } from '../../hooks/useSocket';
import MapView from '../../components/MapView.jsx';
import { Skeleton, ErrorState } from '../../components/ui.jsx';

function Card({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}

export default function AdminOverview() {
  const [overview, setOverview] = useState(null);
  const [buses, setBuses] = useState([]);
  const [error, setError] = useState('');
  async function load() {
    try {
      const [ov, tr] = await Promise.all([api('/api/admin/overview'), api('/api/tracking/active')]);
      setOverview(ov);
      setBuses(tr.buses);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, []);
  useSocket((p) => { if (p?.buses) setBuses(p.buses); });
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!overview) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Operations</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Active buses" value={overview.activeBuses} />
        <Card label="Total buses" value={overview.totalBuses} />
        <Card label="Today's trips" value={overview.todayTrips} />
        <Card label="Delayed trips" value={overview.delayedTrips} />
      </div>
      <div className="h-80 overflow-hidden rounded-2xl border border-line">
        <MapView buses={buses} stops={buses[0]?.stops || []} path={buses[0]?.path || []} />
      </div>
    </div>
  );
}
