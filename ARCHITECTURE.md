# Architecture note

## What I prioritized (and why)

The brief rewards depth in a few areas over breadth, so I optimized for **a complete, reviewable vertical slice**: every listed capability works end to end, with the access-control logic being the most carefully built and tested part, since sharing is where a document product is most likely to be wrong in a way that matters.

1. **Correct sharing/permissions** — one function (`DocumentsService.loadWithRole`) resolves a caller's role (owner / editor / viewer / none) and every operation goes through it. No-access returns **404, not 403**, so document IDs can't be probed.
2. **A usable editing loop** — Tiptap (ProseMirror) gives real rich text with undo/redo and shortcuts. Autosave is debounced, shows status, offers a manual retry on failure, flushes on navigation and warns before closing with unsaved changes.
3. **Import that is product-relevant** — upload turns `.txt` / `.md` / `.docx` into a *new editable document* (the most natural workflow: bring existing work in, then edit and share it).
4. **Zero-friction review** — seeded accounts, one-click login, SQLite (no external service), single Docker service that serves both API and UI.

## Shape of the system

```
React SPA (Vite, Tiptap)  ──/api──▶  NestJS  ──TypeORM──▶  SQLite file
        │                              ├─ AuthModule: JWT login + guard
        └─ served as static files ◀────┤  DocumentsModule: CRUD, sharing, import
           by Nest in production       └─ sanitize-html on every write
```

- **Data model:** `users`, `documents` (`ownerId`, sanitized HTML `content`), `document_shares` (`documentId`, `userId`, `role`, unique per pair).
- **Content format:** HTML from Tiptap, sanitized server-side with a whitelist matching what the editor can produce. Chosen over ProseMirror JSON because it's trivially importable from md/docx converters and renderable anywhere; the trade-off is a lossier schema.
- **Roles:** owner (everything), editor (edit content only), viewer (read only). Only owners rename, share, unshare, delete.
- **Auth:** email + password, bcrypt hashes, 7-day JWT in `localStorage`. Deliberately simple and *demo-grade* (see below).
- **Errors:** global validation pipe + exception filter returning `{statusCode, message}`; the client surfaces messages inline.
- **Security basics:** content sanitized on write (XSS boundary since HTML is rendered), upload size/type limits, `.docx` magic-byte check, generic login error, sharing endpoints owner-only.

## Deliberate scope cuts

| Cut | Why | Next step |
|---|---|---|
| Real-time collaboration / presence | Large surface (CRDT/OT + websockets); not needed to demonstrate sharing | Yjs + Tiptap collaboration extension over a websocket |
| Last-write-wins saves | Two editors on one doc can overwrite each other | Optimistic version check on `PATCH` (409 + merge prompt), then Yjs |
| `synchronize: true` instead of migrations | Zero-config setup for reviewers | Generate TypeORM migrations |
| Demo-grade auth (no signup, token in `localStorage`, public demo-user list) | Spec allows seeded/mocked users | Signup + httpOnly cookie sessions; remove `/auth/demo-users` |
| Share by existing-user email only (no invites) | Keeps the model simple | Pending invites for unknown emails |
| Single file import path | One well-finished flow beats three half-done ones | Attachments, import into existing doc, export to Markdown/PDF |
| Ephemeral storage on free hosting | Free tiers have no durable disk | Volume or Postgres |

## Testing approach

One high-value integration suite (`server/test/documents.e2e.spec.ts`) exercises the real HTTP surface against in-memory SQLite rather than mocking the data layer, because the risk is in the *interaction* of auth, roles, validation and sanitization. The frontend is type-checked and production-built; it has no automated UI tests (next step: Playwright covering the share flow).

## Known limitations
- No concurrent-edit conflict handling (see above).
- Titles can't be changed by editors (intentional; owner-only rename).
- Imported `.docx` keeps headings, bold/italic, lists and links; images, tables and comments are dropped by the sanitizer.
