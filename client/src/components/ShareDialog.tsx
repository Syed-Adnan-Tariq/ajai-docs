import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, ShareEntry } from '../api';

export default function ShareDialog({ docId, onClose }: { docId: string; onClose: () => void }) {
  const [shares, setShares] = useState<ShareEntry[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.shares(docId).then(setShares).catch((e) => setError(e.message));
  }, [docId]);
  useEffect(load, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try { await fn(); load(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    act(async () => { await api.share(docId, email.trim(), role); setEmail(''); });
  };

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="card dialog" role="dialog" aria-modal="true" aria-label="Share document" onMouseDown={(e) => e.stopPropagation()}>
        <div className="row">
          <h3>Share document</h3>
          <div className="spacer" />
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <form className="row" onSubmit={submit}>
          <input type="email" required placeholder="Person's email (e.g. bob@example.com)" value={email}
            onChange={(e) => setEmail(e.target.value)} aria-label="Email to share with" />
          <select value={role} onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')} aria-label="Access level">
            <option value="editor">Can edit</option>
            <option value="viewer">View only</option>
          </select>
          <button className="btn primary" disabled={busy}>Share</button>
        </form>

        {error && <div className="error" role="alert">{error}</div>}

        <div className="label">People with access</div>
        {shares.length === 0 ? <p className="muted small">Only you can see this document.</p> : (
          <ul className="sharelist">
            {shares.map((s) => (
              <li key={s.userId} className="row">
                <div>
                  <strong>{s.user.name}</strong>
                  <div className="muted small">{s.user.email}</div>
                </div>
                <div className="spacer" />
                <select value={s.role} disabled={busy} aria-label={`Access for ${s.user.name}`}
                  onChange={(e) => act(() => api.share(docId, s.user.email, e.target.value as 'editor' | 'viewer'))}>
                  <option value="editor">Can edit</option>
                  <option value="viewer">View only</option>
                </select>
                <button className="btn danger" disabled={busy} onClick={() => act(() => api.unshare(docId, s.userId))}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
