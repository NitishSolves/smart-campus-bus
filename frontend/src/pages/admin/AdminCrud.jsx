import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { EmptyState, ErrorState, PageHeader, Skeleton, StatusBadge } from '../../components/ui.jsx';

function useAdminList(path, key) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await api(path);
      setItems(data[key] || []);
    } catch (err) {
      setError(err.message);
      setItems((prev) => prev ?? []);
    }
  }, [path, key]);

  useEffect(() => { load(); }, [load]);

  return { items, error, setError, load };
}

function ListShell({ loading, error, onRetry, children }) {
  if (loading) return <Skeleton className="h-40 w-full" />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  return children;
}

function FormError({ error }) {
  if (!error) return null;
  return <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>;
}

function Table({ columns, rows }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-muted text-left text-slate-600">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 font-semibold">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  );
}

export function AdminBuses() {
  const { items: buses, error, setError, load } = useAdminList('/api/buses', 'buses');
  const [form, setForm] = useState({ number: '', capacity: 40 });
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader title="Buses" subtitle="Manage the college fleet." />
      <form
        className="card flex flex-wrap gap-2 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            await api('/api/buses', { method: 'POST', body: JSON.stringify(form) });
            setForm({ number: '', capacity: 40 });
            await load();
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <input className="field max-w-xs" placeholder="BUS-05" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
        <input className="field w-24" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
        <button className="btn-blue" type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add bus'}</button>
      </form>
      <FormError error={error} />
      <ListShell loading={!buses} error={error && !buses ? error : ''} onRetry={load}>
        {buses?.length === 0 ? (
          <EmptyState title="No buses" body="Add the first bus to get started." />
        ) : (
          <Table
            columns={['Number', 'Capacity', 'Status', 'Driver']}
            rows={buses?.map((b) => (
              <tr key={b.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium">{b.number}</td>
                <td className="px-4 py-3">{b.capacity}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                <td className="px-4 py-3">{b.driver_name || '—'}</td>
              </tr>
            ))}
          />
        )}
      </ListShell>
    </div>
  );
}

export function AdminRoutes() {
  const { items: routes, error, load } = useAdminList('/api/routes', 'routes');
  return (
    <div className="space-y-3">
      <PageHeader title="Routes" subtitle="Manage bus routes and stops." />
      <ListShell loading={!routes} error={error && !routes ? error : ''} onRetry={load}>
        {routes?.length === 0 ? (
          <EmptyState title="No routes" body="Create routes to assign buses and stops." />
        ) : (
          <div className="grid gap-3">
            {routes?.map((r) => (
              <article key={r.id} className="card p-4">
                <div className="flex justify-between gap-3">
                  <p className="font-semibold">Route {r.code} · {r.name}</p>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 text-sm text-slate-600">{r.start_name} to {r.end_name} · {r.stops?.length || 0} stops · {r.duration_minutes} min</p>
              </article>
            ))}
          </div>
        )}
      </ListShell>
    </div>
  );
}

export function AdminStops() {
  const { items: stops, error, setError, load } = useAdminList('/api/stops', 'stops');
  const [form, setForm] = useState({ name: '', lat: '', lng: '' });
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader title="Stops" subtitle="Manage campus stops and locations." />
      <form className="card grid gap-2 p-4 md:grid-cols-4" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          await api('/api/stops', { method: 'POST', body: JSON.stringify({ ...form, lat: Number(form.lat), lng: Number(form.lng) }) });
          setForm({ name: '', lat: '', lng: '' });
          await load();
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}>
        <input className="field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="field" placeholder="Lat" type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} required />
        <input className="field" placeholder="Lng" type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} required />
        <button className="btn-blue" type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add stop'}</button>
      </form>
      <FormError error={error} />
      <ListShell loading={!stops} error={error && !stops ? error : ''} onRetry={load}>
        {stops?.length === 0 ? (
          <EmptyState title="No stops" body="Add campus stops before building routes." />
        ) : (
          <Table
            columns={['Stop', 'Location']}
            rows={stops?.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">{Number(s.lat).toFixed(4)}, {Number(s.lng).toFixed(4)}</td>
              </tr>
            ))}
          />
        )}
      </ListShell>
    </div>
  );
}

export function AdminDrivers() {
  const { items: drivers, error, load } = useAdminList('/api/admin/drivers', 'drivers');
  return (
    <div className="space-y-3">
      <PageHeader title="Drivers" subtitle="Assignments, licenses and current status." />
      <ListShell loading={!drivers} error={error && !drivers ? error : ''} onRetry={load}>
        {drivers?.length === 0 ? (
          <EmptyState title="No drivers" body="Driver accounts will appear here once created." />
        ) : (
          <Table
            columns={['Name', 'Contact', 'Status', 'Assignment']}
            rows={drivers?.map((d) => (
              <tr key={d.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium">{d.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{d.email}<br />{d.license_no}</td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-3">{d.bus_number || 'No bus'} · Route {d.route_code || '—'}</td>
              </tr>
            ))}
          />
        )}
      </ListShell>
    </div>
  );
}

export function AdminTrips() {
  const { items: trips, error, load } = useAdminList('/api/trips', 'trips');
  return (
    <div className="space-y-3">
      <PageHeader title="Trips" subtitle="Live and recent trips." />
      <ListShell loading={!trips} error={error && !trips ? error : ''} onRetry={load}>
        {trips?.length === 0 ? (
          <EmptyState title="No trips" body="Trips appear here once drivers start them." />
        ) : (
          <Table
            columns={['Bus / Route', 'Driver', 'Occupancy', 'Status']}
            rows={trips?.map((t) => (
              <tr key={t.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium">{t.bus_number} · {t.route_code}</td>
                <td className="px-4 py-3">{t.driver_name}</td>
                <td className="px-4 py-3">{t.occupancy}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status === 'active' ? 'on-time' : t.status} /></td>
              </tr>
            ))}
          />
        )}
      </ListShell>
    </div>
  );
}

export function AdminSettings() {
  const { items: announcements, error, setError, load } = useAdminList('/api/notifications/announcements', 'announcements');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader title="Announcements" subtitle="Share updates with students and staff." />
      <form className="card space-y-2 p-4" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          await api('/api/notifications/announce', { method: 'POST', body: JSON.stringify({ title, body, severity: 'info' }) });
          setTitle(''); setBody('');
          await load();
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}>
        <input className="field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="field min-h-24 py-3" placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} required />
        <button className="btn-blue" type="submit" disabled={busy}>{busy ? 'Publishing…' : 'Publish'}</button>
      </form>
      <FormError error={error} />
      <ListShell loading={!announcements} error={error && !announcements ? error : ''} onRetry={load}>
        {announcements?.length === 0 ? (
          <EmptyState title="No announcements" body="Published announcements will appear here." />
        ) : (
          announcements?.map((a) => (
            <article key={a.id} className="card p-4">
              <div className="flex justify-between gap-3">
                <p className="font-semibold">{a.title}</p>
                <StatusBadge status={a.severity} />
              </div>
              <p className="mt-1 text-sm text-slate-600">{a.body}</p>
            </article>
          ))
        )}
      </ListShell>
    </div>
  );
}
