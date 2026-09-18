import { useNavigate } from 'react-router-dom';
import { LogOut, MapPin, Mail, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader } from '../components/ui.jsx';
import { initials } from '../lib/format.js';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <PageHeader title="Profile" subtitle="Account and pickup preference." />
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-lg font-bold text-white">
            {initials(user.full_name)}
          </div>
          <div>
            <p className="text-lg font-semibold">{user.full_name}</p>
            <p className="text-sm capitalize text-slate-500">{user.role}</p>
          </div>
        </div>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center gap-3 text-slate-700">
            <Mail size={16} className="text-slate-400" aria-hidden="true" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-700">
            <Shield size={16} className="text-slate-400" aria-hidden="true" />
            <span className="capitalize">{user.role} access</span>
          </div>
          {user.role === 'student' && (
            <button type="button" onClick={() => navigate('/stops')} className="flex w-full items-center gap-3 rounded-xl bg-muted px-3 py-3 text-left text-slate-700">
              <MapPin size={16} className="text-primary" aria-hidden="true" />
              <span>Change pickup point</span>
            </button>
          )}
        </dl>
      </div>
      <button type="button" onClick={logout} className="btn-ghost min-h-12 w-full text-red-700">
        <LogOut size={16} aria-hidden="true" />
        Sign out
      </button>
    </div>
  );
}
