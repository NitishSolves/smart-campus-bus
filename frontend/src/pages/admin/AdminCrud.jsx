import { useEffect, useState } from 'react';
import { api } from '../../api';
import { ErrorState, Skeleton, StatusBadge } from '../../components/ui.jsx';

export function AdminBuses() {
  const [buses, setBuses] = useState([]);
  const [form, setForm] = useState({ number: '', capacity: 40 });
  const [error, setError] = useState('');
  async function load() {
    const d = await api('/api/buses');
    setBuses(d.buses);
  }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);
  if (error) return <ErrorState message={error} />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Buses</h1>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await api('/api/buses', { method: 'POST', body: JSON.stringify(form) });
          setForm({ number: '', capacity: 40 });
          load();
        }}
      >
        <input className="min-h-11 rounded-xl border border-line px-3" placeholder="BUS-05" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
        <input className="min-h-11 w-24 rounded-xl border border-line px-3" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
        <button className="min-h-11 cursor-pointer rounded-xl bg-primary px-4 font-semibold text-white" type="submit">Add bus</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Number</th><th>Capacity</th><th>Status</th><th>Driver</th></tr></thead>
          <tbody>
            {buses.map((b) => (
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
    </div>
  );
}

export function AdminRoutes() {
  const [routes, setRoutes] = useState([]);
  useEffect(() => { api('/api/routes').then((d) => setRoutes(d.routes)); }, []);
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Routes</h1>
      {routes.map((r) => (
        <article key={r.id} className="rounded-2xl border border-line bg-white p-4">
          <div className="flex justify-between"><p className="font-semibold">Route {r.code} · {r.name}</p><StatusBadge status={r.status} /></div>
          <p className="text-sm text-slate-600">{r.start_name} to {r.end_name} · {r.stops?.length} stops · {r.duration_minutes} min</p>
        </article>
      ))}
    </div>
  );
}

export function AdminStops() {
  const [stops, setStops] = useState([]);
  const [form, setForm] = useState({ name: '', lat: '', lng: '' });
  async function load() { setStops((await api('/api/stops')).stops); }
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Stops</h1>
      <form className="grid gap-2 md:grid-cols-4" onSubmit={async (e) => {
        e.preventDefault();
        await api('/api/stops', { method: 'POST', body: JSON.stringify({ ...form, lat: Number(form.lat), lng: Number(form.lng) }) });
        setForm({ name: '', lat: '', lng: '' });
        load();
      }}>
        <input className="min-h-11 rounded-xl border border-line px-3" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="min-h-11 rounded-xl border border-line px-3" placeholder="Lat" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} required />
        <input className="min-h-11 rounded-xl border border-line px-3" placeholder="Lng" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} required />
        <button className="min-h-11 cursor-pointer rounded-xl bg-primary font-semibold text-white" type="submit">Add stop</button>
      </form>
      {stops.map((s) => (
        <div key={s.id} className="rounded-xl border border-line bg-white p-3">{s.name} · {Number(s.lat).toFixed(4)}, {Number(s.lng).toFixed(4)}</div>
      ))}
    </div>
  );
}

export function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  useEffect(() => { api('/api/admin/drivers').then((d) => setDrivers(d.drivers)); }, []);
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Drivers</h1>
      {drivers.map((d) => (
        <article key={d.id} className="rounded-2xl border border-line bg-white p-4">
          <p className="font-semibold">{d.full_name}</p>
          <p className="text-sm text-slate-600">{d.email} · {d.license_no}</p>
          <p className="text-sm">{d.bus_number || 'No bus'} · Route {d.route_code || '—'}</p>
        </article>
      ))}
    </div>
  );
}

export function AdminTrips() {
  const [trips, setTrips] = useState([]);
  useEffect(() => { api('/api/trips').then((d) => setTrips(d.trips)); }, []);
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Trips</h1>
      {trips.map((t) => (
        <article key={t.id} className="rounded-2xl border border-line bg-white p-4">
          <div className="flex justify-between">
            <p className="font-semibold">{t.bus_number} · {t.route_code}</p>
            <StatusBadge status={t.status} />
          </div>
          <p className="text-sm text-slate-600">{t.driver_name} · occupancy {t.occupancy}</p>
        </article>
      ))}
    </div>
  );
}

export function AdminSettings() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [items, setItems] = useState([]);
  async function load() { setItems((await api('/api/notifications/announcements')).announcements); }
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Announcements</h1>
      <form className="space-y-2 rounded-2xl border border-line bg-white p-4" onSubmit={async (e) => {
        e.preventDefault();
        await api('/api/notifications/announce', { method: 'POST', body: JSON.stringify({ title, body, severity: 'info' }) });
        setTitle(''); setBody(''); load();
      }}>
        <input className="min-h-11 w-full rounded-xl border border-line px-3" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="min-h-24 w-full rounded-xl border border-line p-3" placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} required />
        <button className="min-h-11 cursor-pointer rounded-xl bg-primary px-4 font-semibold text-white" type="submit">Publish</button>
      </form>
      {items.map((a) => (
        <article key={a.id} className="rounded-xl border border-line bg-white p-3">
          <p className="font-semibold">{a.title}</p>
          <p className="text-sm text-slate-600">{a.body}</p>
        </article>
      ))}
    </div>
  );
}
