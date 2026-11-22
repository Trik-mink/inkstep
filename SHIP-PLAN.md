# Inkstep release scope

Finish one complete elementary math tutoring flow on DeepSpace.
The user has authorized finishing and deployment, while the standing no-automatic-commit rule remains in force.

1. Implement and unit-test a constrained equation checker, deterministic hints, and a small problem bank.
   Accept correct equivalent steps and solved answers; reject ambiguous or unsupported input without counting it as a wrong answer.
2. Add parent-owned learner profiles and server-graded attempts using the existing DeepSpace room and authentication.
   Confirm ownership in server actions, preserve attempts across reload, and deduplicate repeated confirmation.
3. Connect one supported vision integration for explicit handwriting checks.
   Require a signed-in caller, validate and bound the image, cap daily calls, and allow manual transcription on failure.
4. Connect the notebook to the tutor, preserve existing drawing behavior, and test the full important path.
   Keep recognition confirmation separate from math correctness, offer optional help after repeated incorrect attempts, and persist progress.
5. Run the release validation gate, document limits and submission notes, then deploy after the user creates the required commit.

Defer voice, general chat, other subjects, uploads, and comprehensive curriculum coverage.
Use a chosen profile as a parent-managed subprofile, not a separate authentication boundary.
A physical iPad remains a required manual verification environment; automated desktop browser checks do not substitute for it.
