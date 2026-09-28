# Schofy backend

## Connected project

Schofy is connected to project `vpwvhohvykyvzubxlinb` in **KobbyLenus' projects**, London (`eu-west-2`). The creation quote was **$0 per month**. The schema has been applied and `.env.local` contains only the project URL and browser publishable key.

The local sign-in, confirmation and recovery URLs for port 5174 are configured in `supabase/config.toml` and have been pushed to the project. Email confirmation remains enabled. Before hosting the app at a public URL, update the Site URL and redirect allowlist to that actual deployment URL. No production SMTP provider has been configured.

## Connect a project

1. Create a dedicated Supabase project for Schofy, or choose an existing Schofy project.
2. Apply the SQL files in `supabase/migrations/` in chronological order to that project.
3. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the project's API settings. Never put a secret or service-role key in a `VITE_` variable.
4. In Auth URL Configuration, set the production Site URL and allow `http://127.0.0.1:5174/workspace`, `http://127.0.0.1:5174/workspace?recovery=1`, and the corresponding production URLs. Add any other actual development origin in use.
5. Enable email/password authentication, keep email confirmation enabled, and configure production SMTP for confirmation/reset emails.
6. Restart Vite after configuring environment variables. Open `/workspace`, create an owner account, confirm its email, and create the school workspace.

## Data and authentication

- `/workspace`, `/login`, and `/signup` use Supabase Auth. Passwords are managed by Supabase, never by a school record table.
- Sessions persist and refresh using the official client. Password reset links return to `/workspace?recovery=1`.
- Every owner gets one private school workspace. New schools start empty; local demo records are never automatically uploaded.
- Detailed signup collects school name/type, student-count range, country/city, owner name, job title and optional phone. These descriptive details are saved in Auth user metadata and initialise the private school workspace after email confirmation. Metadata is never used to authorize access; the database still checks the authenticated owner ID. Password confirmation is checked before signup.
- All existing modules persist in a Postgres JSONB workspace document, keeping the current data model intact. This is an initial owner-only backend, not a normalized reporting schema or shared team access implementation.
- Row-level security restricts all records to their owner. Changing the user-directory role fields does not grant authentication or access. Role switching remains only in the public demo.
- Saves run in order with database revision checks, preventing one browser from silently overwriting another. On failure, editing pauses; an unsaved JSON export is available before reloading the server version.
- Real school records do not use browser localStorage. Supabase session tokens use the client's normal session persistence. The public demo still saves only its fictional local records.
- SMS, email announcements and WhatsApp remain drafts. Auth emails are handled separately by Supabase.
- The recent-activity list is application data, not an immutable compliance audit log.

## Verification

Live verification passed against the connected Schofy project: sign-in, user identity, anonymous-access denial, save/reload, cross-owner isolation, stale-write rejection, recovery redirects, password recovery and sign-out. Temporary fictional accounts and their school records were removed. Supabase security advisors returned no findings after both migrations. Email delivery itself was not tested; production SMTP remains unconfigured.

Run `npm test` for real in-memory PostgreSQL RLS/ownership/revision checks and save queue tests, then `npm run build`.
Before using real data, verify with two confirmed accounts: create separate schools, save and reload records, verify each account sees only its school, test a stale write from a second tab, and complete sign-in, sign-out, email confirmation and password recovery against the configured project.

