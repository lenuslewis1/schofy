# Schofy local school management workspace

## Pomaa AI assistant

Use **Ask Pomaa** on the dashboard or any workspace page for school questions, workflow guidance, lesson planning and reviewed communication drafts. `npm.cmd run dev` includes its local API. For a built site with the AI backend, run `npm.cmd run build` followed by `npm.cmd start`; a static-only deployment needs a separate API host. See [POMAA.md](POMAA.md) for setup, data handling and verification.

Run `npm.cmd run dev`, open the shown local URL, then choose **Explore demo** for sample data or **Sign in** for the Supabase workspace. See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for connection setup.

## Included workflows

- Admin, front desk, receptionist, teacher, student, parent, accountant, librarian, transport officer and hostel manager role previews.
- Basic, secondary, international, technical/vocational, university and training institute settings; academic year, term/semester, currency and pass threshold.
- Student, guardian and staff records with search, create, edit and CSV export.
- Admissions review with accepted applications converted into student records.
- Classes/courses, faculties/departments, credit hours, capacity and staff assignments.
- Weekly timetables and room assignments.
- Attendance by student and date; present, absent, late and excused statuses. Dashboard percentages derive from saved registers.
- Assessment scores, pass outcomes, CSV exports and printable reports. Selecting a grading-system label does not yet implement institutional GPA or competency rubrics.
- Fee invoices, received-payment records, outstanding balances and expense records. Payments cannot exceed the invoice balance.
- Library catalogue/loan status, transport routes and hostel room occupancy records.
- Editable user directory and role assignment records.
- SMS, email and WhatsApp announcement drafts with an explicit disconnected status.
- Saved settings, recent activity log and JSON backup download.

## Data and access

Public demo data is saved in this browser's localStorage under `northstar-platform-v1` and survives reloads. The separate signed-in workspace persists to Supabase with owner-only row-level security, ordered saves and revision checks. Demo records are never automatically imported into a private workspace. Clearing site data removes local demo records. CSV exports quote cells and neutralize spreadsheet formula prefixes.

Sample data is labelled in the app. The role selector demonstrates workflows and learner-scoped views; it is not authentication or server-enforced authorization. Student and parent previews select one learner. Teacher previews currently operate school-wide, pending account-to-class assignment. No real school data has been imported.

## Live integration work remaining

The Supabase integration provides email/password authentication, password recovery and owner-isolated school storage once a project is connected. Team invitations, server-enforced staff/learner roles, guardian/student and teacher/class account relationships, backup operations and immutable audit logs remain future work. The signed-in workspace fixes the current account to its owner role; user-directory entries do not create accounts or permissions. Current attendance saves default unrecorded students to Present for operator review.

Messaging requires secure server-side provider adapters for an SMS gateway, an email delivery service and WhatsApp Business. Provider credentials must not be stored in the frontend. Sending, delivery receipts, retry handling, consent/opt-outs and WhatsApp templates are not implemented. Local message drafts are never sent.

Finance records track received payments; this version does not charge cards/mobile money, process payroll, reconcile banks or issue statutory accounting reports. Transport and hostel modules are record management; routing/room allocation validation is not automated. Institutional graduation rules, GPA scales, course registration constraints and report-card templates need school-specific configuration.

