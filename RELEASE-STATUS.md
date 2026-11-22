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

The no-mistakes home command reported that the repository is not initialized.
Running `no-mistakes init` refused because this repository has no `origin` remote; the CLI states that it needs a push target and pull-request workflow.
No pipeline run has started, and no pipeline pass is claimed.
DeepSpace source remains unclaimed, as confirmed by the read-only `app source --json` command.
No GitHub remote was added, and no code was pushed or deployed.
The project instructions prohibit setting up another Git host without explicit developer approval.
The release remains gated pending the user's choice of repository setup or acceptance of the unavailable gate.

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
