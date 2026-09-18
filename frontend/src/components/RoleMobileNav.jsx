import { NavLink } from 'react-router-dom';
import { BusFront, ChartColumn, LayoutDashboard, LogOut, Route, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const driverItems = [
  { to: '/driver', label: 'Trip', icon: BusFront, end: true },
  { to: '/driver/history', label: 'History', icon: Route },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

const adminItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/trips', label: 'Trips', icon: Route },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartColumn },
];

export default function RoleMobileNav() {
  const { user, logout } = useAuth();
  const items = user?.role === 'admin' ? adminItems : user?.role === 'driver' ? driverItems : [];
  if (!items.length) return null;
  const cols = items.length + 1;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Primary">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                    isActive ? 'text-primary' : 'text-slate-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`rounded-xl px-3 py-1 ${isActive ? 'bg-blue-50' : ''}`}>
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={logout}
            className="flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-500"
          >
            <span className="rounded-xl px-3 py-1">
              <LogOut size={20} aria-hidden="true" />
            </span>
            Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}
