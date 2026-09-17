import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import RouteCard from '../components/RouteCard.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui.jsx';

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api('/api/routes')
      .then((d) => setRoutes(d.routes))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (error) return <ErrorState message={error} />;
  if (!routes.length) return <EmptyState title="No routes" body="Campus routes will appear here once an administrator adds them." />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Routes</h1>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {routes.map((route) => (
          <RouteCard key={route.id} route={route} onOpen={() => navigate(`/routes/${route.id}`)} />
        ))}
      </div>
    </div>
  );
}
