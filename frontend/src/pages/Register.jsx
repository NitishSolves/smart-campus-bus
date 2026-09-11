import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <h1 className="text-2xl font-semibold">Create student account</h1>
      <form onSubmit={submit} className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-card">
        <label className="block text-sm font-medium" htmlFor="name">Full name</label>
        <input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-line px-3" required />
        <label className="mt-4 block text-sm font-medium" htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-line px-3" required />
        <label className="mt-4 block text-sm font-medium" htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-line px-3" minLength={6} required />
        {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
        <button disabled={busy} className="mt-5 min-h-12 w-full cursor-pointer rounded-xl bg-accent font-semibold text-white" type="submit">{busy ? 'Creating…' : 'Register'}</button>
      </form>
      <Link to="/login" className="mt-6 text-center text-sm font-medium text-primary">Back to sign in</Link>
    </main>
  );
}
