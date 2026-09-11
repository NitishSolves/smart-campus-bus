import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user, logout } = useAuth();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="font-semibold">{user.full_name}</p>
        <p className="text-sm text-slate-600">{user.email}</p>
        <p className="mt-2 capitalize text-sm">Role: {user.role}</p>
      </div>
      <button type="button" onClick={logout} className="min-h-12 w-full cursor-pointer rounded-xl border border-line bg-white font-semibold md:hidden">Sign out</button>
    </div>
  );
}
