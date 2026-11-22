# Inkstep submission draft

Live URL: https://inkstep.app.space
Repository: https://github.com/Trik-mink/inkstep.

## Short note

I built Inkstep, a focused notebook tutor for elementary-school students practicing one-step missing-number equations.
A parent creates learner nicknames; students write a step, confirm or correct its transcription, receive a math check, and request progressive hints.
Confirmed attempts and solved-problem progress persist in DeepSpace.

I used DeepSpace authentication, RecordRoom collections, server-enforced ownership, server actions, and its Anthropic integration proxy for handwriting transcription.
The AI transcribes the student's writing; a restricted equation checker evaluates confirmed math, and curated rules provide hints.
This separation keeps a recognition mistake from silently becoming a wrong-answer judgment.

The main tradeoff was depth over coverage: eight curated problems across four operations, with no voice, homework uploads, other subjects, or open-ended chat.
Board drafts stay on the current browser, while graded text and progress persist in DeepSpace.

The coding agent implemented the notebook, backend actions, math checker, integration, and tests.
I directed the elementary-school audience and notebook/character design, asked for reproductions and root-cause evidence before bug fixes, tested the physical iPad prototype, and personally checked that a DeepSpace record returned after reload with the expected creator ID.
The physical iPad testing exposed input and toolbar problems; final physical-device acceptance remains outstanding and is not claimed as passed.

Agent verification covered a real-backend tutoring flow, real vision transcription of a synthetic equation before confirmation, persistence, duplicate-answer handling, typing fallback, failure recovery, permissions, and the production build.
The second-account browser isolation exercise was skipped; the ownership policies and action checks were exercised in automated tests instead.

The automated review found a progress-history window that can undercount older completions, device-wide companion choices, and prototype pages that still ship.
I chose to submit the verified core first and finish these fixes next; the no-mistakes gate was cancelled and did not pass.
Final iPad acceptance, handwriting accuracy evaluation, and parent-controlled retention/deletion also remain future work.

## Before submitting

- Replace the pending live and repository entries with actual release links.
- Verify the important path on the deployed HTTPS origin, including Safari sign-in.
- Complete the physical iPad check or keep the limitation explicit.
- Review the personal-verification paragraph so it describes only checks actually performed by the applicant.
