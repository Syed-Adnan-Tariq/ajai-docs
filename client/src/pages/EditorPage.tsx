import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, DocDetail } from '../api';
import ShareDialog from '../components/ShareDialog';
import Toolbar from '../components/Toolbar';

type SaveState = 'saved' | 'unsaved' | 'saving' | 'error';
const AUTOSAVE_MS = 800;

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setDoc(null);
    setError('');
    api.get(id!).then(setDoc).catch((e) => setError(e.message === 'Document not found' ? "This document doesn't exist or you don't have access to it." : e.message));
  }, [id]);

  if (error) return (
    <div className="center"><div className="card"><p>{error}</p><Link className="btn" to="/">Back to documents</Link></div></div>
  );
  if (!doc) return <div className="center muted">Loading…</div>;
  return <DocEditor key={doc.id} doc={doc} />;
}

function DocEditor({ doc }: { doc: DocDetail }) {
  const canEdit = doc.role !== 'viewer';
  const isOwner = doc.role === 'owner';
  const [title, setTitle] = useState(doc.title);
  const [status, setStatus] = useState<SaveState>('saved');
  const [saveError, setSaveError] = useState('');
  const [sharing, setSharing] = useState(false);

  const latest = useRef(doc.content);
  const dirty = useRef(false);
  const timer = useRef<number>();
  const inflight = useRef(0);

  const save = useCallback(async () => {
    window.clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    inflight.current++;
    setStatus('saving');
    try {
      await api.update(doc.id, { content: latest.current });
      setSaveError('');
      if (!dirty.current) setStatus('saved');
    } catch (e) {
      dirty.current = true; // keep the change so a retry can resend it
      setStatus('error');
      setSaveError((e as Error).message);
    } finally { inflight.current--; }
  }, [doc.id]);

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } }), Underline],
    content: doc.content,
    editable: canEdit,
    editorProps: { attributes: { 'aria-label': 'Document content', class: 'prose' } },
    onUpdate: ({ editor }) => {
      latest.current = editor.getHTML();
      dirty.current = true;
      setStatus('unsaved');
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(save, AUTOSAVE_MS);
    },
  }, [doc.id]);

  // Flush pending edits when leaving the page, and warn on tab close with unsaved changes.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current || inflight.current) e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => { window.removeEventListener('beforeunload', warn); void save(); };
  }, [save]);

  const saveTitle = async () => {
    const next = title.trim();
    if (!next) { setTitle(doc.title); return; }
    if (next === doc.title) return;
    setStatus('saving');
    try {
      await api.update(doc.id, { title: next });
      doc.title = next;
      setTitle(next);
      setStatus(dirty.current ? 'unsaved' : 'saved');
    } catch (e) {
      setStatus('error');
      setSaveError((e as Error).message);
      setTitle(doc.title);
    }
  };

  const statusText = { saved: 'All changes saved', unsaved: 'Unsaved changes…', saving: 'Saving…', error: 'Save failed' }[status];

  return (
    <div className="page">
      <header className="topbar">
        <Link to="/" className="btn">← Documents</Link>
        <input className="title" value={title} readOnly={!isOwner} aria-label="Document title"
          title={isOwner ? 'Rename document' : 'Only the owner can rename'}
          onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} maxLength={200} />
        <span className={`badge ${doc.role}`}>{isOwner ? 'Owner' : canEdit ? 'Can edit' : 'View only'}</span>
        <div className="spacer" />
        <span className={`status ${status}`} aria-live="polite">{statusText}</span>
        {status === 'error' && <button className="btn" onClick={save}>Retry</button>}
        {isOwner && <button className="btn primary" onClick={() => setSharing(true)}>Share</button>}
      </header>

      {!isOwner && (
        <div className="notice">
          Shared by <strong>{doc.owner.name}</strong> · {canEdit ? 'You can edit this document.' : 'You have view-only access.'}
        </div>
      )}
      {saveError && <div className="error banner" role="alert">{saveError}</div>}

      <main className="editor-wrap">
        {canEdit && editor && <Toolbar editor={editor} />}
        <div className="paper"><EditorContent editor={editor} /></div>
      </main>

      {sharing && <ShareDialog docId={doc.id} onClose={() => setSharing(false)} />}
    </div>
  );
}
