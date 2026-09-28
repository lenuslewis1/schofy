# Pomaa — Schofy’s school assistant

Pomaa is available from the dashboard card and the **Ask Pomaa** button on every workspace page.

## What Pomaa can help with

- Explain student, staff, attendance, fee, assessment and operational records.
- Give a school briefing and suggest priorities.
- Help with admissions, guardians, classes, timetables, library, transport, hostel, settings and other workflows.
- Plan lessons, activities and administrative tasks.
- Prepare school announcements and reminders. The user reviews and edits the audience, channel and wording before saving a draft in Communications.
- Suggest buttons to open relevant workspaces. Pomaa does not autonomously edit records, send messages, collect payments or change access.

## Run locally

Run `npm.cmd run dev` and open its local URL. The Vite server includes Pomaa’s API and accepts demo requests only from loopback connections. The OpenAI key is in the ignored `.env.local` file under `OPENAI_API_KEY`; it is never included in frontend assets. The default model is `gpt-5-mini`, configurable using the server-only `OPENAI_MODEL` variable.

## Production server

Run `npm.cmd run build`, then `npm.cmd start`. The Node server serves both the built site and `/api/pomaa`. It binds to `127.0.0.1:4173` by default. Set `HOST`, `PORT` and the exact `APP_ORIGIN` for deployment behind HTTPS. Configure `OPENAI_API_KEY`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the server environment. Public demo AI is disabled in production; signed-in owner accounts can use Pomaa. A static-only upload of `dist` does not include the AI endpoint.

## Data and access

For signed-in schools, the server validates the Supabase access token using `getUser`, reads that owner’s saved workspace under RLS, and ignores school context supplied by the browser. Pending unsaved changes are not part of the saved summary.

Local role previews supply only the relevant modules and selected learner’s records. Changing the preview role or learner clears the chat. Conversations stay in component memory and are not saved to localStorage or the school database.

Operational summaries are sent to OpenAI when asking Pomaa. Contact fields and health/disciplinary notes are excluded from the generated context. Whatever the user types in the question is sent as conversation content. Responses use `store: false`; this is not a guarantee of zero provider retention. Large record sections are limited to 40 examples and are labelled as such. Fee totals and counts use the full relevant record set.

The server accepts at most eight questions per account/minute in each process. It limits request sizes, history length, response tokens and request duration, rejects cross-origin calls, and validates suggested actions against the allowed workspaces. These process-local limits should be replaced or supplemented by distributed limits for a multi-instance deployment.

## Verification

- Production build and 13 automated tests passed, including owner isolation, context scoping, key handling and access restrictions.
- A synthetic live request returned Pomaa’s introduction and a valid students-navigation suggestion.
- Browser checks used fixed fictional records with intercepted AI replies: reviewed draft saving, chat persistence across pages, role-change isolation, Escape dismissal and mobile width passed.
- The API key was confirmed absent from built assets.
- Screenshots: `output/playwright/pomaa-dashboard-desktop.png`, `pomaa-chat-desktop.png` and `pomaa-chat-mobile.png`.

API documentation: https://developers.openai.com/api/docs/guides/structured-outputs
Supabase token validation: https://supabase.com/docs/reference/javascript/auth-getuser

## File imports

Open **Ask Pomaa → Upload records with Pomaa**. The file chooser shows all files; unsupported binary formats produce a clear error.

- Local parsing: XLSX, XLS, XLSM, ODS, CSV, TSV and JSON record arrays (including named arrays for multiple tables).
- AI reading: PDF, DOC/DOCX, ODT, RTF, PPT/PPTX, TXT, Markdown, HTML, XML and VCF.
- Image reading: JPG/JPEG, PNG and WebP.
- Audio transcription: MP3, MPGA, MPEG, WAV, M4A, MP4 audio tracks, OGG, WebM and FLAC. MP4/WebM imports transcribe the audio; they do not inspect video frames.

Files are limited to 5 MB, with at most 20 tables, 60 columns and 5,000 records. Spreadsheets are parsed in the browser, including saved Excel date values and formatted phone numbers. Formula cells without a saved value require recalculation and saving in Excel first. Macro code is never executed. Plain date strings must be unambiguous YYYY-MM-DD.

PDFs, images, other documents and audio are sent to OpenAI through the authenticated server. Audio first uses `/audio/transcriptions`, then the transcript is converted into structured records. The transcript, source preview/download and extraction notes are available for review. Existing school records are not included in extraction requests. The Responses request sets `store: false`; provider retention rules still apply. Files are not written to disk or uploaded to persistent file storage by this application. A static-only deployment cannot run extraction.

The default extraction model is `gpt-5-mini`, configurable with `OPENAI_IMPORT_MODEL` (otherwise `OPENAI_MODEL`). The default transcription model is `gpt-4o-mini-transcribe`, configurable with `OPENAI_TRANSCRIPTION_MODEL`. Reading requires a configured server key and API credit. Production requires a signed-in owner; loopback development permits local role previews. The server rejects unsupported destinations and access violations.

Pomaa identifies the record type, matches columns and previews ready, duplicate and invalid rows. Users can change mappings, choose worksheets/header rows, page through all rows and correct source values before importing. AI output may contain reading or transcription mistakes and must be checked against the source. Incomplete/truncated AI responses are rejected. Files without explicit school records cannot populate records.

Supported destinations: students, teachers/staff, parents, classes, admissions, timetable, library, transport, hostel, fee invoices, payments, expenses, results, student attendance and staff attendance. Role access limits the available destinations. Users, permissions, settings, message delivery and welfare notes are excluded from bulk import.

Import people before linked attendance, results, parents or invoices; import invoices before payments. Links must resolve to an existing record, payment rows cannot exceed the remaining invoice balance, and duplicate records are skipped. Each import appends ready records without overwriting existing records and retains source columns in `_importSource`, including whether they came from AI extraction. A reviewed worksheet is committed as one workspace update with an audit entry.

Demo imports save in browser storage. Signed-in imports use the existing owner-scoped Supabase revision/save queue and report success only after the save is confirmed. A failed cloud save pauses editing and offers an unsaved backup/reload; it is not reported as a successful import.

### Import verification

23 automated tests and the production build passed. Coverage includes spreadsheet parsing, leading zeros, typed Excel currency amounts/dates, duplicate/invalid handling, payment balances, extraction input types, audio transcription, payload limits, rejected incomplete output, role restrictions, and an imported batch persisted/reloaded through the actual database save function using local PGlite.

Browser checks used fictional CSV/PDF/PNG/audio fixtures with intercepted AI replies: preview, correction, saving, reload persistence, parent restrictions and desktop/mobile layouts passed. These checks verify integration behavior; live PDF/OCR/audio accuracy and a remote Supabase import were not exercised. Screenshots are in `output/playwright/pomaa-import-desktop.png` and `pomaa-import-mobile.png`.

API references: https://developers.openai.com/api/docs/guides/file-inputs and https://developers.openai.com/api/docs/guides/speech-to-text
