# Role previews

The local demo lets an owner preview what each role sees. The selectors in the top bar choose a teacher, learner, route, or hostel building. These previews filter navigation, dashboard totals, tables, exports, and the records Pomaa receives.

- **Admin:** whole school and settings.
- **Teacher:** learners in classes where the teacher is named as lead teacher or assigned in the timetable; those learners' attendance, results, and progress. The teacher can update these records and see their own message and Pomaa drafts. Health notes, fees, contact details, and other classes are excluded.
- **Student / Parent:** the selected learner's academic and fee records.
- **Accountant:** finance records and limited learner details.
- **Librarian:** catalogue and current borrowers.
- **Transport officer:** the selected route, with learners whose `transportRoute` matches its name or ID.
- **Hostel manager:** the selected building, with learners whose `hostelRoom` matches a room there.
- **Front desk / Receptionist:** admissions, parent records, and learner contact details.

An admin assigns a teacher by setting the class's **Lead teacher** or a timetable entry's **Teacher** to the name in Staff & teachers. An admin can set **Transport route** and **Hostel room** on a student record or map those columns during a student import. For a hostel room, use `Building / Room` (for example `Cedar / 101`).

These are **local demo previews**, not staff accounts or a security boundary. Signed-in Supabase workspaces remain owner-only. Before inviting real staff, implement authenticated school membership, server-side role and assignment checks, and database policies for the records each account can read and write.
