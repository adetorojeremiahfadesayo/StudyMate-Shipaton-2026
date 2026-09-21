# Hoplite handoff

Connect your GitHub account in Hoplite, grant access to `adetorojeremiahfadesayo/StudyMate-Mobile`, select `main`, and start a task on a new feature branch. Exact setup controls may vary. Hoplite documents GitHub-connected cloud sandboxes at https://hoplite.sh/ (checked September 21, 2026). Android SDK/emulator availability in your sandbox has not been verified.

## Paste this prompt

```text
Implement StudyMate Mobile for RevenueCat Shipaton Next Gen using this repository.

Read AGENTS.md, docs/implementation-plan.md, docs/HOPLITE.md and studymate/CONTEXT.md. Preserve the existing code. Follow the implementation plan, beginning with M0/M1: inspect baseline code and checks, scaffold the React/Vite + Capacitor Android client, verify authentication, a real backend AI response and a RevenueCat Test Store purchase. Build the working path rather than producing another plan. Continue through the remaining milestones when dependencies are available.

Keep upload → Plain/Story learning → practice → cited feedback → revision PDF coherent. Use cloud-configured secrets only. Document missing credentials/native tooling and complete independent work while blocked. Never substitute canned success for failed live calls or claim native verification from a browser preview.

Update docs/implementation-status.md with commits, commands, actual results and live/test/sample provenance. Finish with a reviewable branch or PR, build/preview artifacts if available, and remaining blockers. Do not merge, deploy, publish, charge real customers or submit the hackathon entry automatically.
```

## Setup

Inspect `studymate/package.json` and its lockfile; select a supported Node version and record it. From `studymate/`, run `npm ci`, then the existing `npm run lint`, `npm test` and `npm run build`. For a cloud web preview, `npm run dev -- --hostname 0.0.0.0` may be used if the environment permits it. That previews the inherited web app, not a native build.

Read `.env.example` and code to confirm variable names. Configure Supabase, the existing AI deployment, optional OCR and RevenueCat using the platform's secure environment configuration. Public client keys are distinct from server secrets. Never commit AI keys, Supabase service-role credentials or RevenueCat secret API keys. Use test billing during development.

Once `mobile/` is implemented, document its install/build/sync commands and required Android SDK/JDK. Check emulator/device access; if unavailable, produce a reproducible package and explicitly hand off native validation. Do not invent a Hoplite config schema or assume environment mirroring copied credentials.

## Review checkpoints

1. M0/M1 baseline and installed mobile/backend/billing feasibility.
2. M2/M3 sourced learning, practice, persistence and PDF.
3. M4 server-enforced entitlements, restore and quotas.
4. M5/M6 device/user QA and submission assets.

The repository starts private for development. Next Gen requires public source and an open-source license before submission; licensing and third-party asset rights remain release checks.
