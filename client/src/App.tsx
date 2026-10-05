import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import DocumentsPage from './pages/DocumentsPage';
import EditorPage from './pages/EditorPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center muted">Loading…</div>;
  if (!user) return <LoginPage />;
  return (
    <Routes>
      <Route path="/" element={<DocumentsPage />} />
      <Route path="/docs/:id" element={<EditorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
