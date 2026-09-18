import { AlertCircle, Bell, BusFront, MapPin, RefreshCw } from 'lucide-react';

const badgeTones = {
  emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-800 ring-amber-100',
  red: 'bg-red-50 text-red-800 ring-red-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  sky: 'bg-sky-50 text-sky-800 ring-sky-100',
  blue: 'bg-blue-50 text-blue-800 ring-blue-100',
  navy: 'bg-navy text-white ring-navy',
};

const statusMap = {
  active: { label: 'Active', tone: 'emerald' },
  'on-time': { label: 'On Time', tone: 'emerald' },
  delayed: { label: 'Delayed', tone: 'amber' },
  high: { label: 'High', tone: 'red' },
  medium: { label: 'Medium', tone: 'amber' },
  low: { label: 'Low', tone: 'emerald' },
  offline: { label: 'Offline', tone: 'slate' },
  idle: { label: 'Idle', tone: 'slate' },
  completed: { label: 'Completed', tone: 'slate' },
  cancelled: { label: 'Cancelled', tone: 'red' },
  maintenance: { label: 'Maintenance', tone: 'slate' },
  info: { label: 'Info', tone: 'sky' },
  warning: { label: 'Warning', tone: 'amber' },
  emergency: { label: 'Emergency', tone: 'red' },
  available: { label: 'Available', tone: 'emerald' },
  'on trip': { label: 'On Trip', tone: 'blue' },
};

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-2xl bg-line ${className}`} />;
}

export function EmptyState({ title, body, action, icon: Icon = BusFront }) {
  return (
    <div className="card p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-primary">
        <Icon size={22} aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle className="mx-auto mb-2 text-red-700" size={22} aria-hidden="true" />
      <p className="font-medium text-red-800">{message || 'Something went wrong'}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-danger mt-3">
          <RefreshCw size={16} aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}

export function Badge({ tone = 'slate', children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeTones[tone] || badgeTones.slate} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase();
  const mapped = statusMap[key];
  return <Badge tone={mapped?.tone || 'slate'}>{mapped?.label || status || 'Unknown'}</Badge>;
}

export function OccupancyIndicator({ level, occupancy, capacity }) {
  const width = capacity ? Math.min(100, Math.round((occupancy / capacity) * 100)) : level === 'high' ? 86 : level === 'medium' ? 58 : 28;
  const color = level === 'high' ? 'bg-red-600' : level === 'medium' ? 'bg-amber-500' : 'bg-emerald-600';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
        <span className="capitalize">Crowd {level || 'unknown'}</span>
        {occupancy != null && <span>{occupancy}/{capacity}</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200" role="img" aria-label={`Crowd level ${level}`}>
        <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function PageHeader({ kicker, title, subtitle, actions }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {kicker ? <p className="text-sm font-medium text-slate-500">{kicker}</p> : null}
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-white text-slate-700 hover:bg-slate-50"
    >
      {children || <Bell size={18} aria-hidden="true" />}
    </button>
  );
}

export function FreshnessChip({ freshness }) {
  if (!freshness) return null;
  return (
    <Badge tone={freshness.tone}>
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {freshness.label}
    </Badge>
  );
}

export function MetricCard({ label, value, hint, alert = false }) {
  return (
    <div className={`card p-4 ${alert ? 'border-red-200 bg-red-50' : ''}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${alert ? 'text-red-700' : 'text-ink'}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder, id }) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="field"
    />
  );
}

export function StopMarker({ className = '' }) {
  return (
    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-primary ${className}`}>
      <MapPin size={16} aria-hidden="true" />
    </span>
  );
}
