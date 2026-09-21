# StudyMate Mobile

Android implementation workspace for the RevenueCat Shipaton 2026 Next Gen track, prepared for development with Hoplite.

**Status:** existing StudyMate web/backend source plus a mobile implementation plan. The Android app and RevenueCat integration are not yet implemented or verified here.

## Start with Hoplite

Connect this repository in Hoplite and paste the task from **[docs/HOPLITE.md](docs/HOPLITE.md)**.

- [Implementation plan](docs/implementation-plan.md): architecture, milestones, data/API contracts, acceptance tests and submission checks.
- [Agent instructions](AGENTS.md): work order and verification requirements.
- [Implementation status](docs/implementation-status.md): actual progress and blockers.
- [Existing application](studymate/): Next.js web app and backend to reuse.

## Existing web app

```sh
cd studymate
npm ci
cp .env.example .env.local
# Configure your own service credentials securely.
npm run dev
```

Baseline checks: `npm run lint`, `npm test`, `npm run build`. They have not been run during repository preparation. The sample demo is not evidence of live service integration. See the existing [product context](studymate/CONTEXT.md) and [original README](docs/original-README.md).

The planned mobile client belongs in `mobile/`; it has not been scaffolded yet. Read the plan before implementation.

## Source and release

Imported from [adetorojeremiahfadesayo/StudyMate](https://github.com/adetorojeremiahfadesayo/StudyMate), source snapshot `5465815`, on September 21, 2026. This repository starts with a new commit history; the original history remains in the source repository. The upstream repository was not modified.

This development repository is private. Before Next Gen submission, make it public, add an appropriate open-source license after confirming asset rights, and complete the release checklist in the plan. No license or submission readiness is implied by this preparation.
