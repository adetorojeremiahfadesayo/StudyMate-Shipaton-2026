# Implementation status

Current status, October 1, 2026: development is on `codex/mobile-mvp`. The existing Railway backend now uses direct OpenAI and configured RevenueCat Test Store billing. Live synthetic text upload, learning preparation, explanation, free practice and PDF export passed; unpaid Pro access was denied. The judge account retains its 18 courses. Android runtime and purchases remain unverified because JDK/Android SDK/device access are unavailable. The dated entries below retain historical results and blockers.

| Milestone | Status | Next evidence |
|---|---|---|
| M0 baseline | Locally tested | 33 backend tests, lint and production build passed |
| M1 Android spike | Partial; backend live tested | Native install, authentication and Test Store purchase on Android |
| M2 learning | Partial; synthetic text path live tested | Scanned PDF OCR and complete client/device flow |
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

## October 1 backend and billing setup review

- The user confirmed `https://studymate-pro.up.railway.app/` is the deployed website origin. An unauthenticated GET of `/` returned HTTP 200; signed-in API, live AI, upload processing and billing remain unverified. The branch's mobile bearer-token and entitlement changes have not been deployed there.
- Added `docs/backend-billing-setup.md` with the existing-backend reuse path, exact Test Store product/entitlement/offering and key placement, and an end-to-end check. Updated environment examples to default real backend mode off the demo path and name the server-only RevenueCat v1 key. No credentials were added.
- Pricing audit: no fixed amount exists in code or RevenueCat config visible in this checkout. The enforced feature boundary is three versus five quiz questions; proposed course and daily-session allowances remain unimplemented. User selected Nigerian and international students as target markets.
- Drafted `docs/pricing-proposal.md` for user review: Free/Plus/Pro/Schools hypotheses, optional session top-ups, a visible assigned-session timer for schools, preliminary regional price tests and implementation gates. These are product proposals only; no tier, quota, timer or price was activated.
- User then selected Free/Pro/Schools. Updated `docs/pricing-proposal.md` to record the agreed direction: Pro US $5.99/month, Nigeria ₦2,500–3,000/month test range, and 30 guided sessions/month, subject to cost and implementation checks. Plus is removed. No paid product or price is live.

## October 1 existing-backend deployment and ads

- **Deployed:** updated the existing Railway production service at `https://studymate-pro.up.railway.app`, deployment `906a94f0-7baf-44b8-bae6-ca32af8c2dce` reported SUCCESS. The user explicitly authorized deployment. No new service/database was created. The first attempt failed at the test gate; the existing website remained running. Fixed Vitest's production React environment and ran the MCP test under Node before retrying.
- **Implemented:** real email/password `/login`, server-validated bearer and cookie identity, ownership enforcement including the legacy demo UUID, production demo-auth bypass disabled, health route and server billing-access route. The independent `/demo` sample remains available. Railway `NEXT_PUBLIC_DEMO_MODE=false` is configured.
- **Preserved/live tested:** the existing confirmed judge account remains present with 18 owned courses; password and course data were not changed. A temporary test session, obtained without sending email or changing the password, read those courses under user RLS. Only that test session was signed out. `/`, `/demo`, `/login` and `/api/health` returned 200; unauthenticated and invalid-bearer course creation returned 401. Billing access returned `unknown` because the RevenueCat secret is missing.
- **Locally tested:** backend dependencies installed; 19 Vitest tests passed with two workers, lint passed, and the production build passed with existing Railway configuration. A concurrent local test run timed out starting two workers; its retry with two workers passed. The final deployed source also passed 19 tests, lint, TypeScript and Next.js production build in Railway's build logs. Read the installed Next.js route-handler and cookies documentation once dependencies were available.
- **Implemented/locally tested ads:** native AdMob test integration at completed practice breaks; every second set, minimum ten-minute interval, consent handling and privacy-options action. Server access is checked before loading and again before display; paid Pro/Schools, unknown status, navigation/account changes or failures skip ads. Six policy tests passed, mobile TypeScript/Vite build passed, and Capacitor Android sync detected AdMob, RevenueCat, Filesystem and Share. These are code and build checks, not native runtime evidence.
- **Configuration:** ignored `mobile/.env` now contains only existing public Supabase values, the same Railway API origin and test-ad setting. No service-role, Azure or RevenueCat secret was copied to the client. Operational helpers and environment files remain ignored by Git.
- **Blocked/unverified:** no readable wiki pages were found in the judge account, so live AI generation and upload processing were not established by this smoke check. Native build/runtime, Android PDF sharing, ad consent/display/dismissal and purchase/restore remain unverified because JDK/Android tooling and billing keys are absent. RevenueCat products/offerings and production AdMob IDs are not configured. Monthly quotas, top-up credits, school seats/timer and persisted mobile answers remain unfinished.

### Follow-up live upload check

- A temporary course with synthetic teaching text was created through the deployed bearer API (200), uploaded (200), and processed to `complete` / `indexed=true`. This establishes the live text-upload/storage/extraction path.
- No wiki pages were generated automatically. The mobile flow still needs to request wiki generation after processing, and that existing route currently accepts cookie auth only. The live explainer returned 500, `No explanation was generated`; AI availability is not established.
- The temporary file and course were removed successfully. Existing judge data was preserved.
- The user confirmed no RevenueCat project exists yet and requested a copyable setup prompt for the separate Chrome account. Test purchase verification remains pending that setup and Android tooling.

## October 1 RevenueCat configuration and verification

- **Configured/live API checked:** opened the user's signed-in StudyMate RevenueCat project `da34e8e9`. Created `studymate_pro`, default offering `default`, and monthly package `$rc_monthly`. Replaced the onboarding USD 9.99 starter product with `studymate_pro_monthly_test_v2`, USD 5.99/month, no trial. The new product is attached to Pro. REST offerings returned 200 and confirmed the expected current offering/package/product.
- **Configured:** Test Store public SDK key saved only in ignored `mobile/.env`; project REST v1 secret labeled `StudyMate Railway Server v1` staged in the existing Railway service. The backend sandbox allowlist contains only the existing judge account's Supabase UUID. No purchase, promotional entitlement, real store product or charge was made. The server subscriber API returned 201 with a profile and empty entitlements.
- **Implemented/locally tested:** server checks the entitlement's corresponding subscription environment, denies sandbox paid access outside the server allowlist, withholds access for unverifiable transaction data, denies refunds and retains active provider grace-period access. Eight billing tests passed; all 22 backend tests passed with one worker, lint passed and Next.js production build passed. An initial two-worker test process crashed on Windows (`0xC0000005`); the one-worker retry completed successfully.
- **Locally tested:** mobile TypeScript/Vite build passed with public configuration, then Capacitor Android sync passed with all four plugins detected. A secret scan found no backend RevenueCat key in the client bundle or Git diff. Operational helpers, keys and browser artifacts remain ignored.
- **Remaining:** Android debug install, Test Store purchase/restore/account switch/expiry and native ads/PDF sharing require JDK/Android SDK/device access. Live AI still returns a provider connection error; automatic material-to-learning preparation remains incomplete. Quotas, webhooks, school seats/timer, top-up credits and persisted mobile answers remain unfinished.

- **Deployed/live tested billing:** deployment `b7ff16e3-0687-4569-98d5-dc49fb9a2c2a` reported SUCCESS. Health returned `billingConfigured=true`; bearer billing access returned 200 / `free` for the judge account with no purchase. Its 18 courses remained readable; unauthenticated/invalid bearer creation still returned 401. Prior upload `77f257e2-39c9-4b9d-8647-68296a8dc05a` failed before compilation because it omitted the `/studymate` service-root prefix. Retried by uploading the repository root.

## October 1 switch to direct OpenAI

- The Azure hostname `studymate-foundry.services.ai.azure.com` failed DNS lookup (`ENOTFOUND`). The user asked to use OpenAI and saved `OPENAI_API_KEY` directly in Railway. A small direct Responses API call to `gpt-5.4-mini` returned `completed`, model snapshot `gpt-5.4-mini-2026-03-17`, with output. This establishes key/model access, not the complete app flow.
- Added direct OpenAI routing with separate model IDs, bounded output, no automatic cross-provider fallback, `store: false`, incomplete-response rejection and safe error metadata. Kept explicitly selected Azure routing available. Six provider tests passed and lint passed.
- Added mobile **Prepare learning**, bearer support for that endpoint, truthful preparation failure, an empty-source explanation guard, and support for string source citations in mobile. Direct OpenAI uses saved course pages instead of the former Foundry endpoint. Production context cannot silently use the sample demo course.
- All 33 backend tests passed with one worker on the completed retry; lint and the Next.js production build passed. A concurrent earlier test run crashed on Windows (`0xC0000005`); retrying after the build completed passed. Mobile TypeScript/Vite build and Capacitor sync passed. A scan found no configured server secrets in the mobile bundle or Git diff. Native runtime and live upload-to-learning verification remain pending.

### Deployment and live course verification

- Commit `0d8bde6` was deployed to the existing Railway service. Deployment `ec27435c-742a-45bc-99c6-97637a9267c1` reported SUCCESS; its build logs confirmed all 33 backend tests, lint and the production build passed.
- A bearer-authenticated synthetic course was created (200), text uploaded (200) and processed to `complete` / `indexed=true`. **Prepare learning** returned 200 with six wiki pages; all six stored references named the uploaded fixture. The explanation returned 200, 2,597 characters and five source references, and mentioned the four concepts in the fixture. This establishes a live text course check, not a general accuracy assessment or native app result.
- The first practice check exposed an inherited MCQ-only `quiz_questions` table and absent `quiz_attempts`. Applied `20261001_upgrade_legacy_quiz_schema.sql` through the signed-in Supabase SQL editor; it returned success. REST schema verification confirmed the added fields and attempts table. Existing rows were preserved. The subsequent free set returned 200 / three questions; an unpaid five-question request returned 403.
- PDF export initially returned 500 because `courses.readiness_score` was missing. Applied `20261001_add_legacy_course_readiness.sql`, which adds a nullable field without overwriting course data; SQL editor reported success. A final complete synthetic flow returned 200 for upload, preparation (six pages), explanation (1,833 characters / four references), three-question practice and PDF export. The PDF was 14,588 bytes with a valid `%PDF` header and contained the temporary course name and uploaded fixture filename. This checks the backend export response and basic contents, not native opening/sharing or persisted mobile answers.
- Inspected all nine live quiz policies: the eight migration policies restrict access to the course owner, and the retained legacy `Users see own quiz_questions` policy also checks `courses.user_id = auth.uid()`. No unrestricted policy was found on these two tables. A final account check confirmed the judge account remains confirmed and owns 18 courses.
- Synthetic files and courses were removed after each check. No existing judge password or study content was changed. Quotas, secure grading, persisted mobile answers, webhooks, school seats/timer and top-ups remain unfinished. No real store purchase or native ad/PDF-share result is claimed.
