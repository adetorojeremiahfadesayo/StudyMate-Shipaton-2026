# Implementation status

September 30, 2026: local mobile implementation started from the clean `14b0c03` source snapshot on branch `codex/mobile-mvp`. This machine has Node 24 but no `java`, `adb`, Gradle or Android SDK commands on PATH. No service credentials were found in the process environment. Native runtime, AI and RevenueCat purchases remain unverified.

| Milestone | Status | Next evidence |
|---|---|---|
| M0 baseline | In progress | Run existing Next.js lint, tests and build after dependency install |
| M1 Android spike | Implemented locally, not native tested | Bundle/sync Android, authenticate, real backend response, Test Store purchase |
| M2 learning | Pending | Import new material and verify sources |
| M3 practice | Pending | Complete persisted session and PDF sharing |
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
