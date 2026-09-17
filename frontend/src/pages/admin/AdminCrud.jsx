import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui.jsx';

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

export function AdminBuses() {
  const { items: buses, error, setError, load } = useAdminList('/api/buses', 'buses');
  const [form, setForm] = useState({ number: '', capacity: 40 });
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Buses</h1>
      <form
        className="flex flex-wrap gap-2"
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
        <input className="min-h-11 rounded-xl border border-line px-3" placeholder="BUS-05" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
        <input className="min-h-11 w-24 rounded-xl border border-line px-3" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
        <button className="min-h-11 cursor-pointer rounded-xl bg-primary px-4 font-semibold text-white disabled:opacity-60" type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add bus'}</button>
      </form>
      <FormError error={error} />
      <ListShell loading={!buses} error={error && !buses ? error : ''} onRetry={load}>
        {buses?.length === 0 ? (
          <EmptyState title="No buses" body="Add the first bus to get started." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-left"><tr><th className="p-3">Number</th><th>Capacity</th><th>Status</th><th>Driver</th></tr></thead>
              <tbody>
                {buses?.map((b) => (
                  <tr key={b.id} className="border-t border-line">
                    <td className="p-3 font-medium">{b.number}</td>
                    <td>{b.capacity}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>{b.driver_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ListShell>
    </div>
  );
}

export function AdminRoutes() {
  const { items: routes, error, load } = useAdminList('/api/routes', 'routes');
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Routes</h1>
      <ListShell loading={!routes} error={error && !routes ? error : ''} onRetry={load}>
        {routes?.length === 0 ? (
          <EmptyState title="No routes" body="Create routes to assign buses and stops." />
        ) : (
          routes?.map((r) => (
            <article key={r.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex justify-between"><p className="font-semibold">Route {r.code} · {r.name}</p><StatusBadge status={r.status} /></div>
              <p className="text-sm text-slate-600">{r.start_name} to {r.end_name} · {r.stops?.length || 0} stops · {r.duration_minutes} min</p>
            </article>
          ))
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
      <h1 className="text-2xl font-semibold">Stops</h1>
      <form className="grid gap-2 md:grid-cols-4" onSubmit={async (e) => {
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
        <input className="min-h-11 rounded-xl border border-line px-3" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="min-h-11 rounded-xl border border-line px-3" placeholder="Lat" type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} required />
        <input className="min-h-11 rounded-xl border border-line px-3" placeholder="Lng" type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} required />
        <button className="min-h-11 cursor-pointer rounded-xl bg-primary font-semibold text-white disabled:opacity-60" type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add stop'}</button>
      </form>
      <FormError error={error} />
      <ListShell loading={!stops} error={error && !stops ? error : ''} onRetry={load}>
        {stops?.length === 0 ? (
          <EmptyState title="No stops" body="Add campus stops before building routes." />
        ) : (
          stops?.map((s) => (
            <div key={s.id} className="rounded-xl border border-line bg-white p-3">{s.name} · {Number(s.lat).toFixed(4)}, {Number(s.lng).toFixed(4)}</div>
          ))
        )}
      </ListShell>
    </div>
  );
}

export function AdminDrivers() {
  const { items: drivers, error, load } = useAdminList('/api/admin/drivers', 'drivers');
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Drivers</h1>
      <ListShell loading={!drivers} error={error && !drivers ? error : ''} onRetry={load}>
        {drivers?.length === 0 ? (
          <EmptyState title="No drivers" body="Driver accounts will appear here once created." />
        ) : (
          drivers?.map((d) => (
            <article key={d.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex justify-between">
                <p className="font-semibold">{d.full_name}</p>
                <StatusBadge status={d.status} />
              </div>
              <p className="text-sm text-slate-600">{d.email} · {d.license_no}</p>
              <p className="text-sm">{d.bus_number || 'No bus'} · Route {d.route_code || '—'}</p>
            </article>
          ))
        )}
      </ListShell>
    </div>
  );
}

export function AdminTrips() {
  const { items: trips, error, load } = useAdminList('/api/trips', 'trips');
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Trips</h1>
      <ListShell loading={!trips} error={error && !trips ? error : ''} onRetry={load}>
        {trips?.length === 0 ? (
          <EmptyState title="No trips" body="Trips appear here once drivers start them." />
        ) : (
          trips?.map((t) => (
            <article key={t.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex justify-between">
                <p className="font-semibold">{t.bus_number} · {t.route_code}</p>
                <StatusBadge status={t.status} />
              </div>
              <p className="text-sm text-slate-600">{t.driver_name} · occupancy {t.occupancy}</p>
            </article>
          ))
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
      <h1 className="text-2xl font-semibold">Announcements</h1>
      <form className="space-y-2 rounded-2xl border border-line bg-white p-4" onSubmit={async (e) => {
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
        <input className="min-h-11 w-full rounded-xl border border-line px-3" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="min-h-24 w-full rounded-xl border border-line p-3" placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} required />
        <button className="min-h-11 cursor-pointer rounded-xl bg-primary px-4 font-semibold text-white disabled:opacity-60" type="submit" disabled={busy}>{busy ? 'Publishing…' : 'Publish'}</button>
      </form>
      <FormError error={error} />
      <ListShell loading={!announcements} error={error && !announcements ? error : ''} onRetry={load}>
        {announcements?.length === 0 ? (
          <EmptyState title="No announcements" body="Published announcements will appear here." />
        ) : (
          announcements?.map((a) => (
            <article key={a.id} className="rounded-xl border border-line bg-white p-3">
              <div className="flex justify-between"><p className="font-semibold">{a.title}</p><StatusBadge status={a.severity} /></div>
              <p className="text-sm text-slate-600">{a.body}</p>
            </article>
          ))
        )}
      </ListShell>
    </div>
  );
}
