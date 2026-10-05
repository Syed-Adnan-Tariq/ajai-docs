import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, DocSummary } from '../api';
import { useAuth } from '../auth';

type Tab = 'owned' | 'shared';

export default function DocumentsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<{ owned: DocSummary[]; shared: DocSummary[] } | null>(null);
  const [tab, setTab] = useState<Tab>('owned');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.list().then(setData).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const run = async (fn: () => Promise<{ id: string } | void>) => {
    setBusy(true);
    setError('');
    try {
      const res = await fn();
      if (res) navigate(`/docs/${res.id}`);
      else load();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const onFile = (file?: File) => {
    if (fileInput.current) fileInput.current.value = '';
    if (file) run(() => api.importFile(file));
  };

  const remove = (d: DocSummary) => {
    if (window.confirm(`Delete "${d.title}"? This also removes access for anyone it was shared with.`)) {
      run(() => api.remove(d.id));
    }
  };

  const list = data?.[tab] ?? [];

  return (
    <div className="page">
      <header className="topbar">
        <strong className="brand">Ajaia Docs</strong>
        <div className="spacer" />
        <span className="muted">{user?.name}</span>
        <button className="btn" onClick={logout}>Sign out</button>
      </header>

      <main className="container">
        <div className="row">
          <h2>Documents</h2>
          <div className="spacer" />
          <input ref={fileInput} type="file" hidden accept=".txt,.md,.markdown,.docx"
            onChange={(e) => onFile(e.target.files?.[0])} />
          <button className="btn" disabled={busy} onClick={() => fileInput.current?.click()}>Upload file</button>
          <button className="btn primary" disabled={busy} onClick={() => run(() => api.create())}>New document</button>
        </div>
        <p className="muted small">Upload turns a <code>.txt</code>, <code>.md</code> or <code>.docx</code> file (max 2 MB) into a new editable document.</p>

        {error && <div className="error" role="alert">{error}</div>}

        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'owned'} className={tab === 'owned' ? 'tab active' : 'tab'} onClick={() => setTab('owned')}>
            My documents {data && <span className="count">{data.owned.length}</span>}
          </button>
          <button role="tab" aria-selected={tab === 'shared'} className={tab === 'shared' ? 'tab active' : 'tab'} onClick={() => setTab('shared')}>
            Shared with me {data && <span className="count">{data.shared.length}</span>}
          </button>
        </div>

        {!data ? <p className="muted">Loading…</p> : list.length === 0 ? (
          <div className="empty muted">
            {tab === 'owned' ? 'No documents yet. Create one or upload a file to get started.' : 'Nothing has been shared with you yet.'}
          </div>
        ) : (
          <ul className="doclist">
            {list.map((d) => (
              <li key={d.id} className="docrow">
                <button className="doclink" onClick={() => navigate(`/docs/${d.id}`)}>
                  <span className="doctitle">{d.title}</span>
                  <span className="muted small">
                    {d.role === 'owner' ? 'Owned by you' : `Shared by ${d.owner.name}`} · Updated {new Date(d.updatedAt).toLocaleString()}
                  </span>
                </button>
                <span className={`badge ${d.role}`}>{d.role === 'owner' ? 'Owner' : d.role === 'editor' ? 'Can edit' : 'View only'}</span>
                {d.role === 'owner' && <button className="btn danger" disabled={busy} onClick={() => remove(d)}>Delete</button>}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
