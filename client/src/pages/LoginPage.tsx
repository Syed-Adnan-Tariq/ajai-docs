import { FormEvent, useEffect, useState } from 'react';
import { api, PublicUser } from '../api';
import { useAuth } from '../auth';

const DEMO_PASSWORD = 'password123';

export default function LoginPage() {
  const { login } = useAuth();
  const [demoUsers, setDemoUsers] = useState<PublicUser[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.demoUsers().then(setDemoUsers).catch(() => {}); }, []);

  const submit = async (e?: FormEvent, creds = { email, password }) => {
    e?.preventDefault();
    setBusy(true);
    setError('');
    try { await login(creds.email, creds.password); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="center">
      <div className="card login">
        <h1>Ajaia Docs</h1>
        <p className="muted">Sign in to create, edit and share documents.</p>

        {demoUsers.length > 0 && (
          <div className="demo">
            <div className="label">Demo accounts (one click)</div>
            {demoUsers.map((u) => (
              <button key={u.id} className="btn demo-btn" disabled={busy}
                onClick={() => submit(undefined, { email: u.email, password: DEMO_PASSWORD })}>
                <strong>{u.name}</strong> <span className="muted">{u.email}</span>
              </button>
            ))}
            <div className="muted small">All demo passwords: <code>{DEMO_PASSWORD}</code></div>
          </div>
        )}

        <form onSubmit={submit}>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="error" role="alert">{error}</div>}
          <button className="btn primary" disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
