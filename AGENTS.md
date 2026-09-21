# StudyMate Mobile cloud-agent instructions

Read `docs/implementation-plan.md`, `docs/HOPLITE.md` and `studymate/CONTEXT.md` first. Follow nested AGENTS.md instructions and installed Next.js 16 documentation for framework-sensitive work.

The existing `studymate/` application is the web/backend foundation. The planned `mobile/` client is React/Vite + Capacitor Android. Preserve existing work and the upload → learn → practice → revision PDF flow. Implement milestones M0–M6 in order, beginning with real Android/backend/RevenueCat feasibility. Do not stop at another plan or UI mockup.

Run baseline checks, record actual results, and maintain `docs/implementation-status.md`. Distinguish implemented, locally tested, live tested, sample and blocked. A browser preview or compiled APK is not proof of native runtime behavior. The inherited sample demo is not proof of live AI or billing. Continue independent work when credentials/tooling are unavailable, while documenting the exact blocked checks.

Validate authentication, ownership, source citations, idempotency, quotas and server-verified entitlements. Never silently substitute canned output after live failure or grant premium access from client flags. Keep credentials out of Git, logs and client bundles. Use cloud environment configuration; do not copy personal MCP configuration or private student data.

Work on a feature branch. Return reviewable changes with test evidence. Do not automatically merge, deploy, publish to stores, charge real customers or submit the hackathon entry.
