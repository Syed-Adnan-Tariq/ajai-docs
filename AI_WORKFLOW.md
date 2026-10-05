# AI workflow note

> **Review before submitting:** the factual items below describe how this build actually went. Sections marked **[EDIT]** are for you to adjust so the note reflects your own process and what you personally verified; reviewers are evaluating your judgment, not just the output.

## Tools used
- **Claude (chat)** — planned the scope, generated the NestJS API, React/Tiptap client, tests and docs, and ran build/test/smoke commands in a sandbox.
- **[EDIT]** Add anything else you used (Cursor, Copilot, ChatGPT, etc.), or delete this line.

## Where AI materially sped things up
- Boilerplate-heavy parts: Nest modules/entities/DTOs, TypeORM relations, auth guard, Vite/React scaffolding, CSS.
- The Tiptap toolbar and autosave wiring, and the Supertest suite structure.
- Producing the Dockerfile/Render blueprint and first drafts of README and the architecture note.
- Quick end-to-end checks (generating a real `.docx` fixture to test import).

## What I changed, rejected, or corrected
- **Test tooling failure → root-caused, not worked around.** Jest crashed on an ESM-only `htmlparser2` v10 pulled in by `sanitize-html`. A path-mapping workaround didn't help (the package is ESM-only), so I pinned the dual-format v9 with an npm `overrides` entry instead of loosening Jest's transform or dropping the sanitizer.
- **Access-control semantics were a deliberate decision:** no-access returns 404 (not 403) to avoid leaking document existence; only owners rename/share/delete; editors change content only.
- **Security over convenience:** content is sanitized server-side with a whitelist rather than trusting the editor's HTML; `.docx` uploads get a magic-byte check.
- **Scope discipline:** rejected adding real-time collaboration, comments and export to keep the core solid (see ARCHITECTURE.md).
- **[EDIT]** Add specific generated output *you* modified or threw away (e.g., UI copy, styling, a library choice, naming, structure).

## How correctness, UX and reliability were verified
Done during the build:
- `npm test` — 5 integration tests passing (permission matrix, validation, sanitization, import).
- Production build of server and client (TypeScript strict, `tsc --noEmit`).
- Smoke test of the production server: static UI + SPA deep link, login, create/list, **persistence across a process restart**, **real `.docx` import** (heading, bold, italic, bullets preserved), and a 3 MB upload rejected with 413.

**[EDIT] Add your own manual verification.** The browser UI was type-checked and built but not exercised by a human in this session, so please click through it yourself and note what you checked, e.g.: formatting toolbar behaviour, refresh persistence, two-window sharing flow (viewer is read-only, editor can edit, revoke works), upload error states, mobile width, and keyboard/screen-reader basics.
