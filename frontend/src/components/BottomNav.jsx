import { NavLink } from 'react-router-dom';
import { House, MapPinned, Route, Star, UserRound } from 'lucide-react';

const items = [
  { to: '/dashboard', label: 'Home', icon: House },
  { to: '/track', label: 'Track', icon: MapPinned },
  { to: '/routes', label: 'Routes', icon: Route },
  { to: '/favorites', label: 'Favorites', icon: Star },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Primary">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
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
      </ul>
    </nav>
  );
}
