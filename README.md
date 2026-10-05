# Ajaia Docs — a lightweight collaborative document editor

A small full-stack app inspired by Google Docs: create and rich-text edit documents, import files, and share documents with other users (editor / view-only), with everything persisted.

**Stack:** React + TypeScript + Vite + [Tiptap](https://tiptap.dev) (editor) · NestJS + TypeORM · SQLite (`better-sqlite3`) · JWT auth · Jest + Supertest.

## Live demo & test accounts

Live URL: `<ADD DEPLOYED URL>` (first load on a free host can take ~30–60 s to wake up).

| User | Email | Password |
|------|-------|----------|
| Alice Anderson | `alice@example.com` | `password123` |
| Bob Brown | `bob@example.com` | `password123` |
| Carol Chen | `carol@example.com` | `password123` |

The login screen also has one-click buttons for these accounts. Accounts are seeded automatically on first boot.

### 60-second sharing demo
1. Sign in as **Alice** → **New document** → type something, use the toolbar.
2. Click **Share**, enter `bob@example.com`, choose **Can edit** (or **View only**).
3. Open a second browser/incognito window, sign in as **Bob** → **Shared with me** tab shows the document with a role badge. A view-only user sees no toolbar and can't type; an editor can edit but can't rename, share or delete.
4. Back as Alice, change Bob's role or click **Remove**; Bob loses access immediately.

## Features

- **Documents:** create, rename (click the title; owner only), edit, autosave (debounced) with a visible save status, reopen after refresh.
- **Rich text:** bold, italic, underline, Heading 1–3, bulleted and numbered lists, undo/redo, keyboard shortcuts.
- **File upload:** import `.txt`, `.md`/`.markdown` or `.docx` (max 2 MB) into a **new editable document**. Supported types are stated on the documents page. Other types are rejected with a clear error.
- **Sharing:** owner grants access by email as **Can edit** or **View only**; change or revoke any time. "My documents" vs "Shared with me" tabs plus Owner / Can edit / View only badges.
- **Persistence:** SQLite file; formatting is stored as sanitized HTML.
- **Quality:** server-side validation (class-validator), uniform JSON errors, HTML sanitization, upload limits, automated API tests.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
# 1. API (http://localhost:3000)
cd server
npm install
npm run start:dev          # seeds demo users and creates ./data/app.db

# 2. Web app (http://localhost:5173, proxies /api to :3000) — in a second terminal
cd client
npm install
npm run dev
```

Open http://localhost:5173.

### Production-style run (one process, like the deployment)
```bash
cd client && npm install && npm run build
cd ../server && npm install && npm run build
NODE_ENV=production JWT_SECRET=change-me PORT=3000 npm start   # serves API + built UI on :3000
```

### Docker
```bash
docker build -t ajaia-docs .
docker run -p 3000:3000 -e JWT_SECRET=change-me -v ajaia-data:/data ajaia-docs
```

### Tests
```bash
cd server && npm test
```
The suite boots the real Nest app against in-memory SQLite and covers: auth required; owner/editor/viewer permission matrix (including 404-not-403 for no access, editor can't rename/share/delete, revoke takes effect); share validation; HTML sanitization (script/onclick/`javascript:` stripped); `.md` and `.txt` import; rejection of unsupported/fake files.

### Environment variables
| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | `3000` | HTTP port |
| `JWT_SECRET` | insecure dev value | **Set in production** |
| `DB_PATH` | `./data/app.db` | SQLite file location |
| `CLIENT_DIST` | `../client/dist` | Built UI to serve, if present |

## Deploying

`render.yaml` + `Dockerfile` deploy it as a single service on Render's free plan (New → Blueprint). **Free hosts have ephemeral disks**: documents reset on redeploy/restart while seeded demo users are recreated. For durable data, attach a volume (Fly.io/Railway/Render paid disk) and point `DB_PATH` at it, or swap SQLite for Postgres (TypeORM makes this a small change).

## API summary

All routes are under `/api`; everything except login and demo-users needs `Authorization: Bearer <jwt>`.

| Method & path | Who | Notes |
|---|---|---|
| `POST /auth/login` | anyone | `{email, password}` → `{token, user}` |
| `GET /documents` | user | `{owned[], shared[]}` with role + owner |
| `POST /documents` | user | create blank doc |
| `POST /documents/import` | user | multipart `file` → new doc |
| `GET /documents/:id` | owner/editor/viewer | 404 if no access |
| `PATCH /documents/:id` | owner (title+content), editor (content) | viewer → 403 |
| `DELETE /documents/:id` | owner | |
| `GET/POST /documents/:id/shares`, `DELETE …/shares/:userId` | owner | role: `editor` \| `viewer` |

See [ARCHITECTURE.md](ARCHITECTURE.md) for design decisions and [AI_WORKFLOW.md](AI_WORKFLOW.md) for the AI usage note.
