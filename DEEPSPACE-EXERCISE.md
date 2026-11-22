# Historical DeepSpace learning exercise

Before the tutor was built, a temporary practice-session page was used to trace a write from the UI through `createConfirmed`, schema validation, the owner-scoped record, acknowledgement, and a read after reload.
The applicant personally verified that the record returned after reload and matched the expected creator ID.
The second-account browser isolation exercise was explicitly skipped.

The temporary page and its collection registration have now been removed from the release.
No persisted records were deleted as part of that removal.
This document records the exercise that actually happened; it is not a runbook for a current production route.

For the current app, use `/learn` to create a nickname, confirm a typed or handwritten math step, and reload to verify persisted progress.
The browser release suite exercises the current authenticated tutor flow and failure recovery.
The offline handwriting experiment remains available through `npm run lab:export`.
