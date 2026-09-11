import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { api } from '../../api';
import { Skeleton, ErrorState } from '../../components/ui.jsx';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api('/api/admin/analytics').then(setData).catch((e) => setError(e.message));
  }, []);
  if (error) return <ErrorState message={error} />;
  if (!data) return <Skeleton className="h-64 w-full" />;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-3 font-semibold">Trips per day</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.tripsPerDay}>
              <CartesianGrid stroke="#E4ECFC" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="trips" stroke="#2563EB" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-3 font-semibold">Route usage</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.routeUsage}>
              <CartesianGrid stroke="#E4ECFC" />
              <XAxis dataKey="code" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="trips" fill="#2563EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-3 font-semibold">Peak demand by hour</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.peakHours}>
              <XAxis dataKey="hour_of_day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg_passengers" fill="#0891B2" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <p className="text-sm text-slate-600">Predicted vs actual ETA uses blended remaining-distance / speed with historical segment times. Average predicted ETA today: {data.etaAccuracy?.avg_predicted ?? 'n/a'} min.</p>
    </div>
  );
}
