# Known issues

## IPAD-INPUT-001: Physical iPad finger drawing does not work reliably

Status: Unresolved; requires reproduction and verification on the physical iPad.
Reported by the user before the exercise-book visual redesign.

The reported symptom is that finger drawing fails on the intended iPad, with a toolbar that can appear pressed.
The cause has not been established on that device.
The existing Ignore finger touches setting intentionally blocks finger input while checked; the reported device failure must also be checked with that setting disabled.

The current code includes an insecure-HTTP ID fallback and browser regressions for a LAN-like HTTP origin.
Those checks are not proof that the physical device issue has been fixed.
Visual previews, simulated pointer events, desktop browser touch emulation, and passing layout checks cannot close this issue.

### Device verification still required

1. Record the iPad model, iPadOS version, browser, page origin, and whether Apple Pencil is connected.
2. Record capture mode and the Ignore finger touches setting.
3. With finger touches explicitly enabled, draw a line using a finger in the actual canvas area.
4. Confirm a visible stroke, updated stroke count and revision, successful undo/redo, and restoration after refresh.
5. Repeat with Apple Pencil and verify that resting a palm does not create accidental marks.
6. Capture the failing sequence and browser diagnostics before changing input code.

Close only after the original failure is reproduced, a cause is identified, and the intended physical device passes a repeatable check.
The exercise-book design review does not modify input handling and does not change this status.

The exercise-book implementation and the later UI interaction fixes do not close this physical iPad issue.
The reproduced moving-mascot and toolbar-appearance defects are tracked separately below.

## IPAD-UI-002: Mascot moves or shrinks, and toolbar looks pressed while writing

Status: Fixed in the application and verified in desktop Chrome and WebKit; confirmation on the intended physical iPad is still required.

### Reproduction and cause

A captured stroke reaching the mascot corner made the active ink bounds intersect its reservation.
The layout immediately chose another corner, so the mascot appeared to run away.
Broad strokes eventually occupied every candidate bounding box and triggered a tiny toolbar-portrait fallback.
The mascot area also allowed pointer events to pass through.
During each stroke, tool locking applied a shared disabled opacity of 38%, so the toolbar changed appearance despite no tool being pressed.

### Correction

Select a safe companion position during restoration or orientation changes and keep it fixed during writing.
The companion absorbs direct touches.
A captured gesture stops its ink at the reserved boundary, including fast segments that cross it between recorded points.
The gesture remains captured until release, preserving normal completion, cancellation, and undo behavior.
Crowded restored pages use a separate margin with a full-size companion rather than a shrinking toolbar portrait.
Toolbar opacity now reflects whether an action is available, independently of the temporary lock during writing.
Selected pen styling and keyboard focus indicators remain distinct.

The regression covers touching the mascot, crossing into its area, unchanged toolbar appearance during a held stroke, and broad writing across the page.
Existing storage, revision IDs, saved points, export, and HTTP-origin tests remain part of the regression suite.
This verification must not be used as evidence that IPAD-INPUT-001 is resolved.

## Release limits

The real tutor is now available at `/learn`; the original offline export remains a drawing-only prototype.
Live recognition was verified on a synthetic equation, not measured against a representative set of child handwriting samples.
The model transcribes the bottommost complete written equation when multiple lines are present; ambiguous results require manual correction.
There are eight curated problems and no voice, uploads, profile deletion, or cross-device handwriting restoration.
The second-account live isolation check was explicitly skipped; ownership and action checks have automated coverage.
Safari sign-in over the local HTTP runtime fails because it does not retain the secure session cookie; use Chrome locally and verify Safari on the deployed HTTPS origin.
The failed-save retry bug was reproduced with a rejected grade response and fixed by restoring the existing transcription without another AI read.
The original core is deployed at https://inkstep.app.space.
The user requested completion of the review follow-up after the early submission.

## Review follow-up awaiting gated release

The progress-history bug was reproduced against the original deployed app by saving a completion and then 105 later attempts.
The follow-up queries solved attempts separately without a row limit, so shelf counts and resume no longer depend on recent history.
Per-learner companion and stationery preferences now include the authenticated parent and learner in their device-local key.
Notebook covers read the same companion preference.
Former device-wide companion and stationery choices are not carried over, so each learner starts once from the default Fox and Sage choices; no writing or progress is deleted.
The public drawing lab and authenticated practice-exercise page and collection registration are removed from the follow-up source.
The offline drawing export is retained.
The broader suite also exposed and verified removal of the hidden 20-learner query limit and an excessive-subscription render failure in the first fix implementation.
All 15 non-billed release browser checks pass on the corrected local runtime.
These source changes are pending the complete no-mistakes gate and deployment; they must not be described as already live.
