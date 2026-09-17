import { Bus, Clock, MapPin, ChevronRight } from 'lucide-react';
import { OccupancyIndicator, StatusBadge } from './ui.jsx';

export default function BusCard({ bus, onTrack }) {
  if (!bus) return null;
  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-card">
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
        <StatusBadge status={bus.status === 'active' ? 'on-time' : bus.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <Clock size={16} aria-hidden="true" />
          <span className="font-semibold text-ink">
            {bus.etaMinutes != null ? `${Math.max(1, Math.round(bus.etaMinutes))} min away` : 'ETA unavailable'}
          </span>
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
          className="mt-4 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 font-semibold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Track Bus
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      )}
    </article>
  );
}
