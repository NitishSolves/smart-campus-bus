import { NavLink } from 'react-router-dom';
import { BusFront, Bell, LayoutDashboard, MapPinned, Route, Star, UserRound, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const studentItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/track', label: 'Live Track', icon: MapPinned },
  { to: '/routes', label: 'Routes', icon: Route },
  { to: '/favorites', label: 'Favorites', icon: Star },
  { to: '/notifications', label: 'Alerts', icon: Bell },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

const driverItems = [
  { to: '/driver', label: 'Trip', icon: BusFront },
  { to: '/driver/history', label: 'History', icon: Route },
];

const adminItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/buses', label: 'Buses', icon: BusFront },
  { to: '/admin/routes', label: 'Routes', icon: Route },
  { to: '/admin/stops', label: 'Stops', icon: MapPinned },
  { to: '/admin/drivers', label: 'Drivers', icon: UserRound },
  { to: '/admin/trips', label: 'Trips', icon: Star },
  { to: '/admin/analytics', label: 'Analytics', icon: LayoutDashboard },
  { to: '/admin/settings', label: 'Announcements', icon: Bell },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const items = user?.role === 'admin' ? adminItems : user?.role === 'driver' ? driverItems : studentItems;
  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-white md:flex md:flex-col">
      <div className="flex items-center gap-2 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
          <BusFront size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold">Campus Bus</p>
          <p className="text-xs capitalize text-slate-500">{user?.role} workspace</p>
        </div>
      </div>
      <nav className="flex-1 px-3" aria-label="Sidebar">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/driver'}
              className={({ isActive }) =>
                `mb-1 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium ${isActive ? 'bg-muted text-primary' : 'text-slate-600 hover:bg-slate-50'}`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={logout}
        className="m-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <LogOut size={18} aria-hidden="true" />
        Sign out
      </button>
    </aside>
  );
}
