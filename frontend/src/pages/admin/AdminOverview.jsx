import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useSocket } from '../../hooks/useSocket';
import MapView from '../../components/MapView.jsx';
import { Skeleton, ErrorState, StatusBadge } from '../../components/ui.jsx';
import { AlertTriangle, AlertCircle } from 'lucide-react';

function MetricCard({ label, value, alert = false }) {
  return (
    <div className={`rounded-2xl border p-4 ${alert ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${alert ? 'text-red-700' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

export default function AdminOverview() {
  const [overview, setOverview] = useState(null);
  const [buses, setBuses] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [error, setError] = useState('');
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  async function load() {
    try {
      const [ov, tr, em] = await Promise.all([
        api('/api/admin/overview'),
        api('/api/tracking/active'),
        api('/api/admin/emergencies'),
      ]);
      setOverview(ov);
      setBuses(tr.buses || []);
      setEmergencies(em.emergencies || []);
    } catch (e) {
      setError(e.message);
    }
  }

  async function acknowledgeEmergency(id) {
    setEmergencyLoading(true);
    try {
      await api(`/api/admin/emergencies/${id}/acknowledge`, { method: 'PUT' });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setEmergencyLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useSocket((p) => {
    if (p?.buses) setBuses(p.buses);
    if (p?.emergency) load();
    if (p?.trip) load();
  });

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!overview) return <Skeleton className="h-40 w-full" />;

  const hasActiveEmergencies = emergencies.some(e => e.status === 'active');
  const activeEmergenciesCount = emergencies.filter(e => e.status === 'active').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Operations Dashboard</h1>
        <p className="text-slate-600 mt-1">Real-time campus transportation monitoring</p>
      </div>

      {hasActiveEmergencies && (
        <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-red-800">Active Emergencies ({activeEmergenciesCount})</h3>
              <div className="mt-3 space-y-2">
                {emergencies.filter(e => e.status === 'active').map((em) => (
                  <div key={em.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{em.bus_number} · {em.driver_name}</p>
                      <p className="text-sm text-slate-600">{em.route_name}</p>
                    </div>
                    <button
                      onClick={() => acknowledgeEmergency(em.id)}
                      disabled={emergencyLoading}
                      className="ml-2 whitespace-nowrap px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      Acknowledge
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Active buses" value={overview.activeBuses} />
        <MetricCard label="Total buses" value={overview.totalBuses} />
        <MetricCard label="Active trips" value={overview.activeTrips} />
        <MetricCard label="Delayed trips" value={overview.delayedTrips} alert={overview.delayedTrips > 0} />
        <MetricCard label="Today's trips" value={overview.todayTrips} />
        <MetricCard label="Active routes" value={overview.activeRoutes} />
        <MetricCard label="Capacity risks" value={overview.capacityRisks} alert={overview.capacityRisks > 0} />
        <MetricCard label="Stale GPS" value={overview.staleGPS} alert={overview.staleGPS > 0} />
      </div>

      {overview.staleGPS > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            {overview.staleGPS} bus(es) have stale GPS data (no update in 5+ minutes). Verify driver status.
          </p>
        </div>
      )}

      <div className="h-96 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <MapView buses={buses} stops={buses[0]?.stops || []} path={buses[0]?.path || []} />
      </div>

      {buses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Active Buses</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {buses.map((bus) => (
                <div key={bus.busId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{bus.busNumber}</p>
                    <p className="text-xs text-slate-600">{bus.routeCode} · {bus.occupancy}/{bus.capacity}</p>
                  </div>
                  <StatusBadge status={bus.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900 mb-3">High Utilization</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {buses.filter(b => b.occupancy > b.capacity * 0.85).map((bus) => (
                <div key={bus.busId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-red-900">{bus.busNumber}</p>
                    <p className="text-xs text-red-700">{Math.round((bus.occupancy / bus.capacity) * 100)}% full</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-700">{bus.occupancy}/{bus.capacity}</p>
                  </div>
                </div>
              ))}
              {buses.filter(b => b.occupancy > b.capacity * 0.85).length === 0 && (
                <p className="text-sm text-slate-500 py-4">No capacity risks at the moment</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
