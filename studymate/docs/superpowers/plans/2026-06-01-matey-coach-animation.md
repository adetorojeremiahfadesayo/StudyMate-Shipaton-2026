# Matey Coach Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Matey, a cute mascot coach, into the StudyMate demo with onboarding guidance, upload/process success feedback, Story Mode dialogue role-play, XP rewards, and exam completion reward feedback.

**Architecture:** Keep the feature app-native inside the existing Next.js demo page. Prepare cropped transparent PNG assets under `public/studymate-assets/matey/`, then render them with React state and CSS animation classes in `app/demo/page.tsx`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, PNG assets, Playwright e2e tests.

---

### Task 1: Asset Preparation

**Files:**
- Create: `public/studymate-assets/matey/matey-welcome.png`
- Create: `public/studymate-assets/matey/matey-thinking.png`
- Create: `public/studymate-assets/matey/matey-celebrate.png`
- Create: `public/studymate-assets/matey/matey-reading.png`
- Create: `public/studymate-assets/matey/matey-badge.png`
- Create: `public/studymate-assets/matey/avatar-lawyer.png`
- Create: `public/studymate-assets/matey/avatar-client.png`
- Create: `public/studymate-assets/matey/avatar-opposing.png`
- Create: `public/studymate-assets/matey/avatar-judge.png`

- [ ] Crop each character from the two supplied Gemini image sheets.
- [ ] Remove the fake checkerboard background by flood-filling border-connected grey background pixels to alpha.
- [ ] Normalize each crop onto a transparent canvas large enough for consistent UI sizing.
- [ ] Keep file paths stable for React `img` tags.

### Task 2: Demo State and UI Model

**Files:**
- Modify: `app/demo/page.tsx`

- [ ] Add `xp`, `xpEvents`, and onboarding state.
- [ ] Add constants for XP awards: upload processed 10, story issue 15, story rule 20, story advice 25, exam issue 20, exam rule 25, exam advice 35, PDF unlock 50.
- [ ] Add a Matey panel that changes pose and text based on the active stage.
- [ ] Keep the current guided workflow intact: upload -> topic -> learn -> exam -> reward.

### Task 3: Story Mode Dialogue Role-Play

**Files:**
- Modify: `app/demo/page.tsx`

- [ ] Replace the Story Mode static card with a role-play scene.
- [ ] Show Matey as coach, client/opposing avatar bubbles as prompts, and a lawyer/user bubble textarea.
- [ ] Award XP on each submitted story step.
- [ ] Keep Story Mode progressive: issue -> rule -> application.

### Task 4: Exam Prep Rewards

**Files:**
- Modify: `app/demo/page.tsx`

- [ ] Award XP after issue, rule, and advice submissions.
- [ ] Show a visible Matey celebration after final advice.
- [ ] Treat the full plain essay as an unlocked reward/PDF-ready explanation rather than the main emotional payoff.

### Task 5: Tests and Verification

**Files:**
- Modify: `e2e/demo-access.spec.ts`

- [ ] Add e2e assertions for Matey onboarding, demo material processing success, Story XP, Exam XP, and Revision PDF unlock.
- [ ] Run `npm test`.
- [ ] Run `npm run lint -- --max-warnings=0`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run test:e2e`.
- [ ] Run `npm run build`.
