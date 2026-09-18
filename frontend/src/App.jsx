import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import BottomNav from './components/BottomNav.jsx';
import RoleMobileNav from './components/RoleMobileNav.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Track from './pages/Track.jsx';
import RoutesPage from './pages/RoutesPage.jsx';
import StopsPage from './pages/StopsPage.jsx';
import RouteDetail from './pages/RouteDetail.jsx';
import StopDetail from './pages/StopDetail.jsx';
import BusDetail from './pages/BusDetail.jsx';
import Favorites from './pages/Favorites.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';
import DriverHome from './pages/driver/DriverHome.jsx';
import DriverHistory from './pages/driver/DriverHistory.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';
import { AdminBuses, AdminRoutes, AdminStops, AdminDrivers, AdminTrips, AdminSettings } from './pages/admin/AdminCrud.jsx';

function Guard({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas text-sm text-slate-500">
        Loading session…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'driver') return <Navigate to="/driver" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function Shell({ children, studentNav, roleNav }) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <a className="skip-link" href="#main">Skip to main content</a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main" className={`mx-auto w-full max-w-6xl flex-1 px-4 py-5 md:px-8 ${studentNav || roleNav ? 'pb-24 md:pb-8' : 'pb-8'}`}>
          {children}
        </main>
        {studentNav && <BottomNav />}
        {roleNav && <RoleMobileNav />}
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas text-slate-500">Loading…</div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/dashboard'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      <Route path="/dashboard" element={<Guard roles={['student']}><Shell studentNav><Dashboard /></Shell></Guard>} />
      <Route path="/track" element={<Guard roles={['student', 'admin']}><Shell studentNav={user?.role === 'student'}><Track /></Shell></Guard>} />
      <Route path="/routes" element={<Guard roles={['student']}><Shell studentNav><RoutesPage /></Shell></Guard>} />
      <Route path="/stops" element={<Guard roles={['student', 'admin']}><Shell studentNav={user?.role === 'student'}><StopsPage /></Shell></Guard>} />
      <Route path="/routes/:id" element={<Guard roles={['student', 'admin']}><Shell studentNav={user?.role === 'student'}><RouteDetail /></Shell></Guard>} />
      <Route path="/stops/:id" element={<Guard roles={['student', 'admin']}><Shell studentNav={user?.role === 'student'}><StopDetail /></Shell></Guard>} />
      <Route path="/buses/:id" element={<Guard roles={['student', 'admin']}><Shell studentNav={user?.role === 'student'}><BusDetail /></Shell></Guard>} />
      <Route path="/favorites" element={<Guard roles={['student']}><Shell studentNav><Favorites /></Shell></Guard>} />
      <Route path="/notifications" element={<Guard roles={['student']}><Shell studentNav><Notifications /></Shell></Guard>} />
      <Route path="/profile" element={<Guard roles={['student', 'driver', 'admin']}><Shell studentNav={user?.role === 'student'} roleNav={user?.role !== 'student'}><Profile /></Shell></Guard>} />

      <Route path="/driver" element={<Guard roles={['driver']}><Shell roleNav><DriverHome /></Shell></Guard>} />
      <Route path="/driver/trip" element={<Guard roles={['driver']}><Shell roleNav><DriverHome /></Shell></Guard>} />
      <Route path="/driver/history" element={<Guard roles={['driver']}><Shell roleNav><DriverHistory /></Shell></Guard>} />

      <Route path="/admin" element={<Guard roles={['admin']}><Shell roleNav><AdminOverview /></Shell></Guard>} />
      <Route path="/admin/buses" element={<Guard roles={['admin']}><Shell roleNav><AdminBuses /></Shell></Guard>} />
      <Route path="/admin/routes" element={<Guard roles={['admin']}><Shell roleNav><AdminRoutes /></Shell></Guard>} />
      <Route path="/admin/stops" element={<Guard roles={['admin']}><Shell roleNav><AdminStops /></Shell></Guard>} />
      <Route path="/admin/drivers" element={<Guard roles={['admin']}><Shell roleNav><AdminDrivers /></Shell></Guard>} />
      <Route path="/admin/trips" element={<Guard roles={['admin']}><Shell roleNav><AdminTrips /></Shell></Guard>} />
      <Route path="/admin/analytics" element={<Guard roles={['admin']}><Shell roleNav><AdminAnalytics /></Shell></Guard>} />
      <Route path="/admin/settings" element={<Guard roles={['admin']}><Shell roleNav><AdminSettings /></Shell></Guard>} />

      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/dashboard') : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
