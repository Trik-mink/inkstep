# Release status

Implementation complete for the bounded first release; deployment pending.

## Verified

- 35 unit tests, including the equation checker, action ownership, idempotency, quota behavior, and actual SDK permission evaluation.
- 50 drawing/notebook browser checks across Chrome and WebKit.
- Six DeepSpace smoke tests against the SDK runtime.
- Real-backend tutoring: learner creation, confirmed steps, hints, duplicate answers, solving, and progress after reload.
- One real Claude vision request successfully read a synthetic handwritten x=12; grading waited for confirmation.
- Recognition failure falls back to typing, and failed grade saves can be retried without another AI read.
- Anonymous actions and direct owner-billed proxy calls are rejected.
- Type checking, lint, production build, and regenerated drawing preview pass.
- Production dependency audit: no high or critical findings; one low-severity esbuild advisory remains.

## Not claimed

- Final acceptance on the user's physical iPad.
- Recognition accuracy on a representative set of children's handwriting.
- Live two-account isolation, which the user explicitly skipped.
- A deployed HTTPS authentication and persistence check.
- A no-mistakes pipeline pass.

## Release gate status

The user explicitly authorized the release commit on November 21, 2026, overriding the standing no-automatic-commit instruction for this release.
Release branch: `feat/inkstep-tutor`.
Commit subject: `Ship Inkstep handwriting tutor on DeepSpace`.

The GitHub repository is https://github.com/Trik-mink/inkstep.
The validation-only main branch is pushed; the application is on feat/inkstep-tutor.
GitHub email privacy protection rejected the first push, so unpublished commit emails were replaced with the verified GitHub noreply address.
Original commit history remains preserved locally under refs/inkstep/pre-email-privacy/.

No-mistakes was initialized and started against the entire application diff.
The user explicitly requested cancellation after the reviewer recorded only startup for more than fifteen minutes.
The cancelled run returned branch custody without changing the submitted app commit.
Claude authentication was expired; Codex reported connector authentication errors, and isolated startup probes rejected both the configured gpt-6.1-sol model and the native CLI default gpt-5.5 model for the connected ChatGPT account.
Claude subscription login was then restored and the restarted review completed with four findings.
The user approved durable progress, learner-specific companions, and removal of both public prototype surfaces, then requested deployment before completing those fixes.
The second run and its fix round were cancelled at that explicit change of priority.
Branch custody returned cleanly with no pipeline fix commits.
No pipeline test pass, PR, CI pass, or full gate pass is claimed.
The user authorized publishing the repository and deploying the existing verified core with these limitations disclosed.
See KNOWN-ISSUES.md for the deferred findings.
Deployment is in preparation.

## Entry redesign follow-up

The welcome, signed-out gate, and learner library now share an illustrated notebook design using the existing companion artwork.
Ten entry/tutor browser checks pass; the already-verified billed vision check was intentionally skipped in that repeat run.
The 35 unit tests, type check, lint, and production build pass after the redesign.
No authentication mechanics, ownership policies, grading rules, or recognition calls were changed for this visual task.
Deployment remains pending.
The public welcome and parent controls also pass WebKit checks at 768×1024 and 1024×768 with no overflow or page errors.

## Navigation and settings consistency

The navigation, account menu, signed-out dialog, and settings screen now use the same paper, sage, and gold notebook styling as the welcome and learner library.
Eight entry and navigation browser checks passed, including 390px mobile and 1024px tablet settings, mobile menu navigation, account identity, and overflow checks.
The 35 unit tests, type check, lint, and production build passed after the theme changes.
Existing authentication and sign-out mechanisms were preserved.
