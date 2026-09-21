# StudyMate Product Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MVP version of StudyMate's smart coaching layer across dashboard, recommendations, course overview, navigation, trust, weak areas, story mode, and empty states.

**Architecture:** Add a shared deterministic recommendation helper in `lib`, reusable UI components in `components/shared`, then wire them into existing Next.js server pages. Keep data fetching server-side and avoid schema changes.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Supabase, lucide-react.

---

### Task 1: Shared Recommendation Engine

**Files:**
- Create: `lib/study-recommendations.ts`

- [x] Define metric and recommendation types.
- [x] Implement course progress step calculation.
- [x] Implement ranked next-action generation.
- [x] Implement weak-area generation.

### Task 2: Reusable Coaching UI

**Files:**
- Create: `components/shared/StudyActionPanel.tsx`
- Create: `components/shared/CourseProgressMap.tsx`
- Create: `components/shared/WeakAreasPanel.tsx`

- [x] Build a compact next-action panel for dashboard and course pages.
- [x] Build a four-step progress map.
- [x] Build weak-area cards.

### Task 3: Restore Dashboard Shell And Navigation

**Files:**
- Modify: `app/(dashboard)/layout.tsx`
- Modify: `components/shared/Sidebar.tsx`
- Modify: `components/shared/Navbar.tsx`

- [x] Render `DashboardShell` for dashboard routes.
- [x] Add Recommendations, Study Plan, and Revision PDFs navigation.
- [x] Add a demo CTA back to `/demo`.

### Task 4: Dashboard Coaching

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`

- [x] Fetch metrics needed for next action and weak areas.
- [x] Show next-best-action panel.
- [x] Show first-run onboarding actions.

### Task 5: Recommendations Page

**Files:**
- Modify: `app/(dashboard)/recommendations/page.tsx`

- [x] Replace placeholder with ranked course recommendations.
- [x] Show weak areas and course readiness.
- [x] Provide empty account starter actions.

### Task 6: Course Overview Progress Map

**Files:**
- Modify: `app/(dashboard)/courses/[courseId]/page.tsx`

- [x] Fetch additional course metrics.
- [x] Show progress map, next action, source trust, and weak areas.

### Task 7: Empty States, Trust, Story Mode

**Files:**
- Modify: `components/materials/FileList.tsx`
- Modify: `components/shared/SourcesUsedPanel.tsx`
- Modify: `components/shared/StoryModePanel.tsx`
- Modify: `app/(dashboard)/courses/page.tsx`

- [x] Improve empty states with direct starter actions.
- [x] Strengthen source trust copy.
- [x] Make Story Mode checkpoints clearer.

### Task 8: Verification

**Files:**
- Existing test/build config.

- [ ] Run lint/type checks.
- [ ] Run focused tests if available.
- [ ] Start dev server or report blocker.
