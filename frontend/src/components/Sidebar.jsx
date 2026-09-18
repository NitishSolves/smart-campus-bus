import { NavLink } from 'react-router-dom';
import {
  Bell,
  BusFront,
  ChartColumn,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Route,
  Star,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../lib/format.js';

export const studentItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/track', label: 'Live Track', icon: MapPinned },
  { to: '/routes', label: 'Routes', icon: Route },
  { to: '/favorites', label: 'Favorites', icon: Star },
  { to: '/notifications', label: 'Alerts', icon: Bell },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export const driverItems = [
  { to: '/driver', label: 'Trip', icon: BusFront, end: true },
  { to: '/driver/history', label: 'History', icon: Route },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export const adminItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/buses', label: 'Buses', icon: BusFront },
  { to: '/admin/routes', label: 'Routes', icon: Route },
  { to: '/admin/stops', label: 'Stops', icon: MapPinned },
  { to: '/admin/drivers', label: 'Drivers', icon: UserRound },
  { to: '/admin/trips', label: 'Trips', icon: Star },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartColumn },
  { to: '/admin/settings', label: 'Announcements', icon: Bell },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const items = user?.role === 'admin' ? adminItems : user?.role === 'driver' ? driverItems : studentItems;
  const roleLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'driver' ? 'Driver' : 'Student';

  return (
    <aside className="hidden w-64 shrink-0 bg-navy text-white md:flex md:flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
          <BusFront size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold leading-tight">Smart Campus Bus</p>
          <p className="text-xs text-white/60">{roleLabel} workspace</p>
        </div>
      </div>
      <nav className="flex-1 px-3" aria-label="Sidebar">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end || item.to === '/admin' || item.to === '/driver'}
              className={({ isActive }) =>
                `mb-1 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                  isActive ? 'bg-white text-navy' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
            {initials(user?.full_name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.full_name}</p>
            <p className="truncate text-xs capitalize text-white/55">{user?.role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
