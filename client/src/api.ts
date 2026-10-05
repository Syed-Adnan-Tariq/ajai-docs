export type Role = 'owner' | 'editor' | 'viewer';
export interface PublicUser { id: string; name: string; email: string }
export interface DocSummary { id: string; title: string; updatedAt: string; role: Role; owner: PublicUser }
export interface DocDetail extends DocSummary { content: string }
export interface ShareEntry { userId: string; role: 'editor' | 'viewer'; user: PublicUser }

const TOKEN_KEY = 'ajaia.token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') {
      setToken(null);
      window.dispatchEvent(new Event('ajaia:logout'));
    }
    throw new ApiError(res.status, body.message || `Request failed (${res.status})`);
  }
  return body as T;
}

export const api = {
  demoUsers: () => request<PublicUser[]>('/auth/demo-users'),
  login: (email: string, password: string) =>
    request<{ token: string; user: PublicUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request<PublicUser>('/auth/me'),
  list: () => request<{ owned: DocSummary[]; shared: DocSummary[] }>('/documents'),
  create: (title?: string) => request<{ id: string }>('/documents', { method: 'POST', body: JSON.stringify({ title }) }),
  get: (id: string) => request<DocDetail>(`/documents/${id}`),
  update: (id: string, patch: { title?: string; content?: string }) =>
    request<{ id: string; title: string; updatedAt: string }>(`/documents/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => request<void>(`/documents/${id}`, { method: 'DELETE' }),
  importFile: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ id: string }>('/documents/import', { method: 'POST', body: form });
  },
  shares: (id: string) => request<ShareEntry[]>(`/documents/${id}/shares`),
  share: (id: string, email: string, role: 'editor' | 'viewer') =>
    request<ShareEntry>(`/documents/${id}/shares`, { method: 'POST', body: JSON.stringify({ email, role }) }),
  unshare: (id: string, userId: string) => request<void>(`/documents/${id}/shares/${userId}`, { method: 'DELETE' }),
};
