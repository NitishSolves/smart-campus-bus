export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-line ${className}`} />;
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-medium text-red-800">{message || 'Something went wrong'}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 min-h-11 cursor-pointer rounded-xl bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    active: 'bg-emerald-100 text-emerald-800',
    'on-time': 'bg-emerald-100 text-emerald-800',
    delayed: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-emerald-100 text-emerald-800',
    offline: 'bg-slate-100 text-slate-600',
    idle: 'bg-slate-100 text-slate-600',
    completed: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-100 text-red-800',
    maintenance: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${map[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export function OccupancyIndicator({ level, occupancy, capacity }) {
  const width = capacity ? Math.min(100, Math.round((occupancy / capacity) * 100)) : level === 'high' ? 86 : level === 'medium' ? 58 : 28;
  const color = level === 'high' ? 'bg-red-600' : level === 'medium' ? 'bg-amber-500' : 'bg-emerald-600';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
        <span>Crowd {level}</span>
        {occupancy != null && <span>{occupancy}/{capacity}</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200" role="img" aria-label={`Crowd level ${level}`}>
        <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
