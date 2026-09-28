# SchoolERP Ghana reference review

Reference reviewed: https://schoolerpghana.com/ and https://schoolerpghana.com/features

## Incorporated

- Student history: Alumni and Withdrawn enrolment statuses, using the existing editable student records.
- Student wellbeing: health notes and disciplinary incidents, dated per student, with Open / Resolved follow-up.
- Staff attendance: daily statuses, arrival times, notes, saved registers and CSV export. Unmarked records are not assumed present.
- Academics: per-student, subject and academic-period SBA / exam scores, configurable 30/70, 40/60 or 50/50 weights, school pass threshold, scoped read-only parent/student previews, and CSV progress reports.
- Finance: outstanding invoice list, arrears export with guardian names, internal reminder drafts, and individual CSV payment receipts. Existing finance supports partial payment records and GHS.
- Landing page: feature descriptions and links to the corresponding workspaces; added wellbeing, staff attendance and progress-report cards. Changed preview currency to GHS.

## Verification

- Production build passed.
- Browser: 80 SBA and 70 exam produce 73 at 30/70 and 74 at 40/60.
- Progress scores survive reload through the existing browser store.
- Staff attendance saves; welfare records can be created and resolved.
- Arrears CSV downloads and reminder drafts appear in Communications without delivery.
- A fictional GHS 100 payment reduces a GHS 2,500 invoice balance to GHS 2,400; its receipt downloads with the invoice, method and reference.
- Parent preview has no welfare page and cannot edit progress scores or weighting.
- Desktop and 390px mobile screenshots are in output/playwright. Wide tables scroll within their containers.

## Integration boundaries

This is a locally saved demonstration. Role previews are not authentication or server-enforced access controls. Live school data requires a secure backend. Mobile money/USSD, card processing, SMS/email/WhatsApp delivery and biometric hardware require integrations. Payroll tax/pension rules and certified GES grading are not implemented or claimed. These require separate configuration and verification before production.

The reference informed feature selection. Northstar retains its existing branding and visual design.
