import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BusFront, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const demos = [
  { role: 'Student', email: 'student@campus.edu', password: 'student123' },
  { role: 'Driver', email: 'driver@campus.edu', password: 'driver123' },
  { role: 'Admin', email: 'admin@campus.edu', password: 'admin123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('student@campus.edu');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'driver') navigate('/driver');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-canvas">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-navy to-navy-800" />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-8 text-white">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <BusFront aria-hidden="true" />
          </div>
          <p className="text-sm text-white/70">Safe rides. Smarter campuses.</p>
          <h1 className="mt-1 text-3xl font-bold">Smart Campus Bus</h1>
          <p className="mt-2 text-sm text-white/75">Sign in to track buses, ETAs and crowding.</p>
        </div>
        <form onSubmit={submit} className="card p-6 shadow-sheet">
          <label className="block text-sm font-medium" htmlFor="email">Email</label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field pl-9" required />
          </div>
          <label className="mt-4 block text-sm font-medium" htmlFor="password">Password</label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field pl-9" required />
          </div>
          {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
          <button disabled={busy} className="btn-primary mt-5 min-h-12 w-full" type="submit">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="mt-5 grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo accounts</p>
          {demos.map((d) => (
            <button
              key={d.role}
              type="button"
              onClick={() => { setEmail(d.email); setPassword(d.password); }}
              className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl border border-line bg-white px-3 text-left text-sm hover:border-primary/40"
            >
              <span className="font-medium">{d.role}</span>
              <span className="text-slate-500">{d.email}</span>
            </button>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-600">
          New student? <Link className="font-semibold text-primary" to="/register">Create account</Link>
        </p>
      </div>
    </main>
  );
}
