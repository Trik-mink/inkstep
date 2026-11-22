# Exercise 1: save, reload, and explain ownership

## Finish condition

Create one typed practice-session record, receive the server acknowledgement, reload, and find the same record ID.
Then use a second signed-in account to verify it cannot read the first account's record.
Use fictional answers, without a child's name or real handwriting, for this exercise.

## 1. Start the actual SDK runtime

```sh
cd ~/Desktop/DeepSpace/handwriting-lab
nvm use 22
npx deepspace auth login
npx deepspace auth whoami
npx deepspace dev start
```

Complete browser sign-in yourself; do not paste credentials or session files into chat.
Check the account shown by `whoami` before running `dev start`: first use registers this app under the active CLI account and replaces the placeholder app ID.
This exercise does not deploy or commit; do not use `app init` or `deploy` here, since those can create an initial commit.
Keep the terminal running and follow the URL it prints, normally `http://localhost:5173/practice-lab`.
Sign in on the app page too if prompted.
CLI login authorizes development; the browser session identifies the person making record requests.
The exported HTML and Python file server cannot run this exercise.

## 2. Observe before saving

Open `/practice-lab` through the SDK runtime.
Find the signed-in user ID, app scope, collection name, and read connection status.
Wait for the connection to become ready.
The scope comes from `src/constants.ts`: `app:${APP_ID}`, with the actual ID supplied by registration and the build.
No team ID is involved in this exercise.

## 3. Trace the write

Enter `x = 12` and select **Save practice record**.
The handler in `src/pages/(app)/(protected)/practice-lab.tsx` calls `createConfirmed` for `practice_sessions`.
The hook resolves the enclosing scope from `src/pages/(app)/_layout.tsx` and sends the write over the records connection.
The server validates the columns and permission declared in `src/schemas/practice-sessions-schema.ts`.
DeepSpace supplies the `createdBy` metadata rather than accepting a browser-selected owner field.
The server persists the row in its RecordRoom and sends an acknowledgement.
Only after that acknowledgement does this page show **Server confirmed record**.
Do not treat an unconfirmed write as a failed write that is automatically safe to repeat; first check which record, if any, persisted.

## 4. Trace the read

Note the acknowledged record ID and creator ID.
Reload the page.
The success message is local component state and disappears; the saved row must return through `useQuery`.
The query subscribes to `practice_sessions` in the same app scope.
It has no client-side owner filter: the server applies the collection's `read: 'own'` rule before returning rows.
Compare the returned ID with the one you noted, and compare `createdBy` with the signed-in user ID.
This demonstrates persistence across a browser reload in the local SDK runtime, not production cloud deployment.

## 5. Verify isolation

Use a separate browser profile or private window and sign in as another account.
Open the same runtime's `/practice-lab` route and confirm the account ID is different.
Wait for read status **ready**, then check that the first account's record ID is absent.
The schema applies owner-only reading to both members and admins for this collection.
This exercise is append-only: editing and deletion are disabled.
Changing roles, adding a team, or merely hiding a row in React is not part of this exercise.
For stronger evidence, inspect the second browser's records WebSocket responses and verify the first record is never delivered.

## Checks and current limits

```sh
npx tsc --noEmit
npm run lint
npx vitest run --config vitest.practice.config.ts
```

The seven permission tests invoke the installed SDK evaluator, including ownership isolation, denied anonymous writes, forged data-owner fields, and denied mutation of existing rows.
They do not prove the real server correctly stamps identity or persists records.
`tests/practice.spec.ts` defines a two-account save/reload/isolation check for the actual SDK test runtime.
It needs two usable DeepSpace test accounts; no test accounts have been created as part of this exercise.
After account setup, run `npx deepspace test run e2e --grep "practice record survives reload"`.
The user has completed CLI sign-in and `dev start` has registered the app.
The runtime at `http://127.0.0.1:5173/practice-lab` returns HTTP 200 and displays the sign-in gate without page errors in Chrome.
The authenticated save/reload flow and two-account browser check remain unverified.

## Explain it back

“The save button calls ___ in collection ___, inside scope ___.
The server identifies the owner using ___.
I know the write was acknowledged because ___.
After reload, ___ reads it back.
Another account cannot read it because ___.”

## Sources

The implementation follows the installed DeepSpace 0.44.2 types and these official guides.

- [Data storage and confirmed mutations](https://docs.deep.space/guides/data-storage)
- [Data model and record envelopes](https://docs.deep.space/concepts/data-model)
- [Permissions and ownership](https://docs.deep.space/concepts/permissions)
- [Installation, identity, and first-use registration](https://docs.deep.space/get-started/installation)
