import { ArrowRight } from 'lucide-react';
import { StatusBadge } from './ui.jsx';

export default function RouteCard({ route, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(route)}
      className="card w-full cursor-pointer p-4 text-left transition hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-navy px-2 py-1 text-xs font-bold text-white">Route {route.code}</span>
        <StatusBadge status={route.status} />
      </div>
      <h3 className="mt-3 font-semibold">{route.name}</h3>
      <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
        {route.start_name || route.startName}
        <ArrowRight size={14} aria-hidden="true" />
        {route.end_name || route.endName}
      </p>
      <p className="mt-2 text-xs text-slate-500">{route.duration_minutes || route.durationMinutes} min · {(route.stops || []).length} stops</p>
    </button>
  );
}
