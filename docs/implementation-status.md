# Implementation status

September 30, 2026: local mobile implementation started from the clean `14b0c03` source snapshot on branch `codex/mobile-mvp`. This machine has Node 24 but no `java`, `adb`, Gradle or Android SDK commands on PATH. No service credentials were found in the process environment. Native runtime, AI and RevenueCat purchases remain unverified.

| Milestone | Status | Next evidence |
|---|---|---|
| M0 baseline | In progress | Run existing Next.js lint, tests and build after dependency install |
| M1 Android spike | Implemented locally, not native tested | Bundle/sync Android, authenticate, real backend response, Test Store purchase |
| M2 learning | Pending | Import new material and verify sources |
| M3 practice | Partial | Self-check and PDF share code added; persist attempts and verify on Android |
| M4 billing | Partial | Longer practice set checks RevenueCat server entitlement; quota and webhook remain pending |
| M5 QA | Pending | Student and actual Android observations |
| M6 submission | Pending | License, assets, public video and submission verification |

For every update record date, commit, behavior, checks and actual output, live/test/sample provenance, blockers and next step. Do not include secrets or personal documents.

## September 30 implementation detail

- Added `mobile/`: Vite/React client with Supabase sign-in, course list/creation, PDF or text upload, Plain/Story explanation, practice self-check, and RevenueCat purchase/restore screen.
- Existing backend now accepts a validated Supabase bearer token for the routes used by the mobile client. Its service-role client is only returned after `auth.getUser(token)` succeeds. Course ownership checks remain on each route.
- Five-question sets require a server lookup of the `studymate_pro` entitlement. Missing RevenueCat configuration, network errors and expired access deny this premium feature. Three-question sets remain free.
- Existing quiz generation exposes answer keys to the client. The mobile UI labels this as self-check; secure grading and persisted revision output remain unfinished. No live AI, Android or payment result is claimed.
- Setup requires the website's public Supabase URL/anon key, a reachable backend URL, a RevenueCat public mobile SDK key, and a RevenueCat secret API key **only on the backend**. Do not put server secrets into `VITE_` variables.
- `mobile/npm install` succeeded after one registry `ECONNRESET` retry. `mobile/npm run build` passed TypeScript and Vite. `npx cap add android` generated the native project and detected the RevenueCat Capacitor plugin. `android/gradlew.bat assembleDebug` failed because `JAVA_HOME` is unset and no Java executable is on PATH. No APK or device observation is available.
- `npx cap sync android` completed and detected the RevenueCat plugin. Backend `npm ci` did not finish before the deadline check and was stopped; backend lint, tests and build are unverified. The installed Next.js documentation was unavailable during this edit.
- October 1 follow-up: enabled bearer-authenticated report generation from mobile, with PDF download in browser and native file/share handling through Capacitor Filesystem and Share. Mobile TypeScript/Vite build passed after this addition. Native PDF opening/sharing is still unverified because Android tooling is absent.
- Capacitor sync completed with Filesystem, Share and RevenueCat plugins detected. A direct Node check passed for active Pro entitlement and provider-failure denial. Backend dependency installation remained incomplete, so the Vitest suite, lint and Next.js build are still unverified.

## October 1 testing and Shipaton refresh

- `mobile/npm run build` passed again. A local Vite browser launch displayed the expected setup screen; browser console showed only a missing favicon request. This confirms the client boots without keys, not authenticated functionality or native behavior.
- No `mobile/.env` or `studymate/.env.local` exists in this checkout, and no Android SDK/JDK was found on PATH. Authentication, live AI, PDF sharing on Android and RevenueCat purchase/restore remain untested.
- Changed Android `launchMode` from Capacitor's generated `singleTask` to `singleTop` per RevenueCat's Capacitor instructions so external purchase verification does not cancel the flow.
- Devpost announced a 12-hour extension to October 1, 12:00 PDT / 20:00 WAT. The rules page still contains the prior cutoff. The event workspace records both sources and the current Next Gen submission requirements.
