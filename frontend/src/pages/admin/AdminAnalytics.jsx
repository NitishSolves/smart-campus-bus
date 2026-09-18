import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { api } from '../../api';
import { Skeleton, ErrorState, EmptyState, PageHeader } from '../../components/ui.jsx';

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
      <PageHeader title="Analytics" subtitle="Trip counts, route usage and peak demand from stored samples." />
      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Trips per day</h2>
        {!data.tripsPerDay?.length ? (
          <EmptyState title="No trip samples" body="Trip counts appear here after trips are recorded." />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.tripsPerDay}>
                <CartesianGrid stroke="#E2E8F4" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="trips" stroke="#2563EB" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Route usage</h2>
        {!data.routeUsage?.length ? (
          <EmptyState title="No route usage" body="Usage appears after trips run on routes." />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.routeUsage}>
                <CartesianGrid stroke="#E2E8F4" />
                <XAxis dataKey="code" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="trips" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Peak demand by hour</h2>
        {!data.peakHours?.length ? (
          <EmptyState title="No demand samples" body="Hourly demand is derived from historical_demand." />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peakHours}>
                <XAxis dataKey="hour_of_day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avg_passengers" fill="#0891B2" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
      <p className="text-sm text-slate-600">
        ETA is remaining-distance / speed blended with historical segment times, not a trained ML model.
        Average stored prediction today: {data.etaAccuracy?.avg_predicted ?? 'n/a'} min
        {data.etaAccuracy?.samples ? ` (${data.etaAccuracy.samples} samples)` : ''}.
      </p>
    </div>
  );
}
