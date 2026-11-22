# Release status

The original verified core is live at https://inkstep.app.space.
The public repository is https://github.com/Trik-mink/inkstep.
The follow-up fixes below are implemented locally and awaiting the complete no-mistakes gate and a subsequent release.

## Follow-up fixes

Solved progress and resume use a separate owner-scoped query filtered to solved attempts, with no history-row cap.
Recent history still uses the latest 100 attempts.
The learner list no longer silently truncates after 20 records.
Companion and stationery preferences are scoped to both the parent and learner, shared across that learner’s problems, and reflected on notebook covers.
The public drawing-lab route, its welcome link, and the practice-exercise route and collection registration have been removed.
The offline drawing export and its development tests remain.
No persisted user records were deleted.

## Local evidence for this follow-up

- 28 unit tests, type checking, and lint pass.
- 50 offline drawing and notebook checks pass across Chrome and WebKit.
- 15 release browser checks pass against the SDK runtime.
- The billed vision check was intentionally skipped in this repeat run; it passed once before the original release.
- Regression cases first failed on the unchanged deployed app for old completion loss, mismatched companion covers, and the public prototype link.
- The progress regression adds 105 later attempts, reloads, verifies the old completion, and resumes the next unsolved problem.
- The companion regression switches learners, changes stationery, advances a problem, reloads, and checks the matching cover.
- The production Worker/client build passes.

The unit count decreased because the retired practice-exercise schema and its seven assertions were removed.
Tutor ownership, grading, quota, and SDK permission tests remain.

## Limits and gate history

Final physical iPad acceptance, representative children’s handwriting accuracy, and the explicitly skipped two-account browser exercise are not claimed.
The original release was shipped at the user’s request before gate fixes were complete.
The first gate attempt was cancelled after reviewer startup failed; Claude subscription authentication was restored.
The second review identified the four findings addressed by this follow-up, but its fix round was cancelled for the user-authorized early release.
The user then requested completion of the full run.
No full gate pass is claimed in this file; use the pull request and its pipeline evidence for the final outcome.
