import { Bus, ChevronRight, Clock, MapPin } from 'lucide-react';
import { OccupancyIndicator, StatusBadge, FreshnessChip } from './ui.jsx';
import { formatEta, freshness } from '../lib/format.js';

export default function BusCard({ bus, onTrack, connected }) {
  if (!bus) return null;
  const eta = formatEta(bus.etaMinutes);
  const live = freshness({ lastUpdate: bus.lastUpdate, calculationMode: bus.calculationMode, connected });
  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <Bus size={22} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{bus.busNumber}</h3>
            <p className="text-sm text-slate-600">Route {bus.routeCode} · {bus.routeName}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={bus.status === 'active' ? 'on-time' : bus.status} />
          <FreshnessChip freshness={live} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <Clock size={16} aria-hidden="true" />
          <span className="font-semibold text-ink">{eta || 'ETA unavailable'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <MapPin size={16} aria-hidden="true" />
          <span>Next: {bus.nextStop?.name || '—'}</span>
        </div>
      </div>
      <div className="mt-4">
        <OccupancyIndicator level={bus.crowd} occupancy={bus.occupancy} capacity={bus.capacity} />
      </div>
      {onTrack && (
        <button
          type="button"
          onClick={() => onTrack(bus)}
          className="btn-blue mt-4 min-h-12 w-full"
        >
          Track Bus
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      )}
    </article>
  );
}
