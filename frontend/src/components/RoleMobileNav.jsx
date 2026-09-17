import { NavLink } from 'react-router-dom';
import { BusFront, LayoutDashboard, LogOut, Route } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const driverItems = [
  { to: '/driver', label: 'Trip', icon: BusFront, end: true },
  { to: '/driver/history', label: 'History', icon: Route },
];

const adminItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/trips', label: 'Trips', icon: Route },
];

export default function RoleMobileNav() {
  const { user, logout } = useAuth();
  const items = user?.role === 'admin' ? adminItems : user?.role === 'driver' ? driverItems : [];
  if (!items.length) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Primary">
      <ul className="grid grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 text-xs font-medium ${isActive ? 'text-primary' : 'text-slate-500'}`
                }
              >
                <Icon size={20} aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={logout}
            className="flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-1 text-xs font-medium text-slate-500"
          >
            <LogOut size={20} aria-hidden="true" />
            Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}
