# Inkstep

A handwriting-first math tutor for grades 3–4, built on DeepSpace.
A parent signs in, creates a learner nickname, and opens a personal notebook.
The student writes a step, confirms or corrects the AI transcription, and gets a math check with optional progressive hints.

## First release

- Eight curated one-step find-x problems across addition, subtraction, multiplication, and exact division.
- iPad-oriented notebook with pen, whole-stroke eraser, undo/redo, Sage and Plum stationery, and selectable Fox or Owl companions.
- Explicit AI transcription through DeepSpace's `anthropic/chat-completion` integration using Claude Haiku 4.5.
- Confirmation before grading; manual typing remains available, including when recognition fails.
- Deterministic, restricted linear-equation checking without `eval` or model-generated grades.
- Correct equivalent steps and solved answers are distinguished from copied problems, incorrect steps, and unsupported formats.
- Parent-owned learner profiles and server-saved progress; repeated unchanged answers do not inflate the offer-of-help threshold.

## Run

Use a supported Node line from `package.json` (Node 22.15+, 24, or 26) and npm 11.6+.

```sh
npm install
npx deepspace auth login
npx deepspace auth whoami
npx deepspace dev start
```

Open the printed local URL, then `/learn`.
CLI authentication authorizes development; sign in on the app page to identify the parent making record requests.
Use Chrome for plain-HTTP local authentication: Safari rejects the secure session cookie on the local HTTP setup.
The intended deployed origin uses HTTPS; the deployed Safari flow still requires verification.

The public landing is `/` and the authenticated tutor is `/learn`.
The drawing-only prototype is retained as an offline export through `npm run lab:export`; prototype web routes and the practice-session collection are no longer part of the release.
The full app requires the SDK runtime; the static HTML export contains only the drawing prototype.

## Architecture and ownership

`src/schemas.ts` registers collections in the app's immutable `app:${APP_ID}` RecordRoom.
Learner profiles belong to the authenticated parent through server-stamped `createdBy`; profiles are not independent child logins.
Records are filtered server-side by owner-only permissions, including for the app's room admin role.
The `tutor-grade` and `tutor-read` server actions verify profile ownership before accessing data or calling a provider.
Direct browser writes to grades and quota records are denied.
Grade writes use a stable identity derived from the caller, learner, problem, submission, and normalized answer to make retries idempotent.

Board drafts remain in browser storage under parent, learner, and problem-specific keys.
Confirmed text, outcomes, and progress are stored in DeepSpace and return after reload.
Raw handwriting images are sent for explicit AI reading; this release does not save those images to the cloud.
Cross-device draft restoration is not implemented.

AI reads are owner-billed, authenticated, capped at 30 per caller per UTC day, and limited in image and output size.
Each read reserves a unique quota slot before the provider call, including failed reads.
Direct owner-billed integration proxy calls are blocked, so they cannot bypass the tutor's quota action.
The model reads handwriting only; it does not decide math correctness or invent the lesson's hints.

## Verification

```sh
npm run validate
npm run lint
npm run build
npm run test:tutor
npm run lab:export
npx playwright install webkit
npm run lab:e2e
npx deepspace test run smoke --port 5180
```

With the SDK development server running and one usable DeepSpace test account in the SDK's local pool:

```sh
npm run test:release
```

The live vision test is opt-in because it makes a real billed request:

```sh
INKSTEP_LIVE_VISION=1 npm run test:release -- --grep "live handwriting"
```

Verified during development: the complete real-backend tutoring flow, saved progress after reload, duplicate-answer handling, optional hints, real vision transcription of a synthetic equation, typing fallback, denied anonymous/direct-paid requests, and retrying failed saves.
The offline browser suite covers Chrome/WebKit, tablet layout, storage failures, canceled gestures, companion boundaries, and insecure-HTTP drawing.
The second-account browser isolation exercise was explicitly skipped by the user; ownership is covered by real SDK permission-evaluator and action-level tests.
Physical iPad acceptance is still outstanding; see `KNOWN-ISSUES.md`.

## Release

The SDK is pinned to DeepSpace 0.44.2.
The app is registered, but deployment is pending a user-created release commit and resolution of the unconfigured no-mistakes gate.
Do not invoke `deploy` with an unborn Git history: the CLI may make an initial commit, conflicting with the user's no-automatic-commit instruction.
The default source repository is DeepSpace's cloud repository; no GitHub repository has been created.

```sh
npx deepspace deploy
```

Only use that command after the release commit and validation decision.
Keep `.dev.vars`, `.deepspace`, `.wrangler`, `dist`, screenshots, test traces, and local credentials out of source control.

## Tradeoffs and next work

The release prioritizes a finished math interaction over broad subject coverage.
Voice, uploaded homework, general chat, custom problem generation, profile deletion, and a comprehensive curriculum are deferred.
The eight fixed problems keep the model's role narrow and make correctness independently testable.
Next priorities are a physical iPad acceptance pass, recognition evaluation on actual learner handwriting, and a retention/deletion flow before wider use.

See `SUBMISSION.md` for an honest submission-note draft and `DEEPSPACE-EXERCISE.md` for the persistence walkthrough.

## Welcome and learner library

The public entrance is a single-screen illustrated notebook scene with the existing Fox and Owl artwork and one primary action.
Parent explanations and sign-in access live in the secondary **For parents** panel.
The signed-out app gate uses the same illustration while preserving the existing DeepSpace authentication flow.
Returning families choose illustrated notebook covers showing saved progress; selection still opens the first unfinished problem.
New notebook creation and detailed parent progress are secondary controls.
The entry flow was checked at 320, 768, 1024, and 1440 pixels, including keyboard focus when opening and closing the creation form.

## Progress and presentation preferences

Notebook completion uses a separate, owner-scoped subscription filtered to solved attempts, without a row limit.
The SDK supports an omitted limit, so completion and resume do not depend on the recent-history window or the age of the solved record.
This keeps the bounded eight-problem product on platform query primitives without adding a second progress store or a migration.
For a larger curriculum or much larger family histories, a server-maintained completion projection would reduce the amount of solved history transferred.
The most recent 100 family attempts are used only for the parent history list.
Companion and stationery preferences are stored on the device under a key containing both the authenticated parent ID and learner ID.
The notebook cover reads the same companion preference as the board.
Preferences are shared across that learner’s problems, but are not synced across devices or live across open tabs.
Former device-wide choices reset once to the per-learner defaults; no writing or progress is deleted.
