# Submission contents

## Links
- **Live product:** `<ADD DEPLOYED URL>`
- **Walkthrough video:** see `WALKTHROUGH_VIDEO_URL.txt` → `<ADD LOOM/YOUTUBE URL>`

## Test accounts (password for all: `password123`)
`alice@example.com`, `bob@example.com`, `carol@example.com` — seeded automatically; one-click buttons on the login page.
Suggested review path: Alice creates/uploads a doc and shares it with Bob (editor or viewer); sign in as Bob in a private window.

## What's in this folder
| Path | Contents |
|---|---|
| `server/` | NestJS API (auth, documents, sharing, import) + Jest/Supertest tests in `server/test/` |
| `client/` | React + TypeScript + Tiptap web app |
| `README.md` | Setup, run, test, deploy, API summary |
| `ARCHITECTURE.md` | Architecture and prioritization note, scope cuts |
| `AI_WORKFLOW.md` | AI-native workflow note |
| `SUBMISSION.md` | This file |
| `WALKTHROUGH_VIDEO_URL.txt` | Link to the 3–5 min walkthrough |
| `docs/WALKTHROUGH_SCRIPT.md` | Outline used for the video |
| `Dockerfile`, `render.yaml` | Single-service deployment |

## Status
**Working end to end:** create / rename / edit / autosave / reopen documents; bold, italic, underline, H1–H3, bulleted and numbered lists; upload `.txt`, `.md`, `.docx` into a new editable document (limits shown in UI); owner-based sharing with editor/view-only roles, role changes and revocation, "My documents" vs "Shared with me" with badges; SQLite persistence; validation and error handling; 5 automated API tests.

**Partial / not included:** no real-time collaboration or conflict detection (last write wins); demo-grade auth (no signup); schema via `synchronize` not migrations; no automated UI tests; free-tier hosting has ephemeral storage, so documents reset on redeploy/restart.

**Next with another 2–4 hours:** optimistic-concurrency check on save, then Yjs-based live collaboration with presence; Playwright test for the share flow; migrations and durable storage; export to Markdown/PDF.
