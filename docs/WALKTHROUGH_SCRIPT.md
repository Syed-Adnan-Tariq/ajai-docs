# Walkthrough video script (target ~4 minutes)

Record with Loom/YouTube (unlisted). Put the link in `WALKTHROUGH_VIDEO_URL.txt`.

**0:00 – Intro (20s).** What it is, stack in one sentence, and that the focus was a complete slice with solid sharing logic.

**0:20 – Main flow as Alice (75s).** Sign in via demo button → New document → rename → type text → show Heading dropdown, bold/italic/underline, bullet + numbered list → point at "Saving… / All changes saved" → refresh the page to show persistence.

**1:35 – Upload (30s).** Upload a `.md` (and/or `.docx`) → it opens as a new editable doc. Mention supported types are shown on the page and others are rejected.

**2:05 – Sharing (60s).** Share with Bob as *View only* → switch to a private window as Bob → "Shared with me" tab + badge → show no toolbar/can't type. Back as Alice, switch Bob to *Can edit* → Bob edits; show Bob can't rename/share/delete. Remove access → Bob refresh gets "no access".

**3:05 – Engineering (40s).** Show `loadWithRole` in `documents.service.ts` and the test run (`npm test`, 5 passing). Mention sanitization and 404-not-403.

**3:45 – Cuts + AI (35s).** Deprioritized: real-time collab, conflict handling, migrations, production auth. Next with 2–4 hours: version check on save → Yjs. AI: how you used it and what you changed or verified (be specific and honest).
