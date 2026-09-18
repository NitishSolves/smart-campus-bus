import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BusFront } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register({ fullName, email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-canvas">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-navy to-navy-800" />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-6 flex items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary">
            <BusFront aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Create student account</h1>
            <p className="text-sm text-white/70">Track campus buses from your phone</p>
          </div>
        </div>
        <form onSubmit={submit} className="card p-6 shadow-sheet">
          <label className="block text-sm font-medium" htmlFor="name">Full name</label>
          <input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="field" required />
          <label className="mt-4 block text-sm font-medium" htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" required />
          <label className="mt-4 block text-sm font-medium" htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" minLength={6} required />
          {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
          <button disabled={busy} className="btn-primary mt-5 min-h-12 w-full" type="submit">{busy ? 'Creating…' : 'Register'}</button>
        </form>
        <Link to="/login" className="mt-6 text-center text-sm font-medium text-primary">Back to sign in</Link>
      </div>
    </main>
  );
}
