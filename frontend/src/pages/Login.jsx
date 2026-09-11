import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BusFront } from 'lucide-react';
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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
          <BusFront aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Smart Campus Bus</h1>
          <p className="text-sm text-slate-600">Live location, ETA and crowding</p>
        </div>
      </div>
      <form onSubmit={submit} className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <label className="block text-sm font-medium" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-line px-3" required />
        <label className="mt-4 block text-sm font-medium" htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-line px-3" required />
        {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
        <button disabled={busy} className="mt-5 min-h-12 w-full cursor-pointer rounded-xl bg-accent font-semibold text-white hover:bg-orange-700 disabled:opacity-50" type="submit">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="mt-5 grid gap-2">
        {demos.map((d) => (
          <button key={d.role} type="button" onClick={() => { setEmail(d.email); setPassword(d.password); }} className="min-h-11 cursor-pointer rounded-xl border border-line bg-white px-3 text-left text-sm hover:border-primary/40">
            Demo {d.role}: {d.email}
          </button>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">
        New student? <Link className="font-semibold text-primary" to="/register">Create account</Link>
      </p>
    </main>
  );
}
