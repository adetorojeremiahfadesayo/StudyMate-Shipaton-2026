# StudyMate Mobile

StudyMate Mobile for RevenueCat Shipaton 2026: upload course material, learn in Plain or Story mode, practise, review feedback, and export a revision PDF.

**Status:** authenticated study sessions, Free/Pro quotas, a credit ledger, Schools assignments/timers, saved grading and revision PDFs are implemented on `codex/mobile-mvp`. Backend tests, live API checks and one real AI study journey passed. Android purchase, ads and sharing remain unverified. The latest webhook null-field fix and topic-focused quiz update await backend deployment; see [implementation status](docs/implementation-status.md).

## Hackathon browser preview

The separate hackathon repository is being prepared as `adetorojeremiahfadesayo/StudyMate-Shipaton-2026`. Its GitHub Pages workflow builds the mobile client and uses the existing backend at `https://studymate-pro.up.railway.app`. Deployment results and the verified link will be recorded in the implementation status.

Sign in with a StudyMate account to use the real backend. Judges can use the existing test account shared separately; its password is not included in this repository. Browser purchases are disabled; native RevenueCat billing requires Android. The website's separate `/demo` page contains sample material and does not prove billing or AI execution.

The preview workflow accepts only public Supabase URL/anon key and backend URL through repository variables. Server credentials stay on the backend. See [GitHub preview setup](docs/github-preview.md).

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

Backend checks: `npm run lint`, `npm test`, `npm run build`. Actual results and Windows worker settings are recorded in the implementation status. The sample demo is not evidence of live service integration. See the existing [product context](studymate/CONTEXT.md) and [original README](docs/original-README.md).

The mobile client and generated Android project are in [mobile/](mobile/README.md). Follow its setup steps for local builds.

## Source and release

Imported from [adetorojeremiahfadesayo/StudyMate](https://github.com/adetorojeremiahfadesayo/StudyMate), source snapshot `5465815`, on September 21, 2026. This repository starts with a new commit history; the original history remains in the source repository. The upstream repository was not modified.

The hackathon repository preserves this development history and the upstream attribution. Creating a separate repository does not imply that all work began during the event. Licensing, third-party asset rights, native runtime checks and final submission remain release checks; no submission readiness is implied.
