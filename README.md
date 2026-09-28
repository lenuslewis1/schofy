# Schofy

School simplified. A React/Vite school management workspace with student records, admissions, attendance, fees, assessments, timetables and the Pomaa AI assistant.

## Local development

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and configure the services you need.
3. Run `npm run dev` and open the local URL shown in the terminal.

Choose **Explore demo** for sample records, or sign in to use a private school workspace once the backend is configured. Keep environment files and server credentials out of version control.

## Checks and production

```sh
npm test
npm run build
npm start
```

The production server serves the built site and Pomaa API. Configure `APP_ORIGIN` for the hosted site's exact origin. A static deployment requires a separate API host.

## Setup and capabilities

- [Workspace workflows and limitations](LOCAL_WORKSPACE.md)
- [Authentication and database setup](SUPABASE_SETUP.md)
- [Pomaa assistant setup](POMAA.md)
- [Pomaa import workflows](POMAA_AI.md)

Private workspaces currently support school-owner accounts. Other roles are demo previews. Messaging delivery and online payment collection are not connected.
