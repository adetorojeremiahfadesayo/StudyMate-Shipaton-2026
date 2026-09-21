# StudyMate Product Coach Design

## Goal

Turn StudyMate from a set of study tools into a guided product that tells students what to do next, why it matters, and how each action improves exam readiness.

## Scope

This MVP covers all 10 requested improvements through existing data and routes:

- Smart recommendations page.
- Dashboard next-best-action panel.
- More consistent StudyMate/Matey dashboard voice.
- Course progress map.
- Expanded outcome-based navigation.
- First-run guidance for empty states.
- Stronger source trust surfaces.
- Weak-area detection from existing metrics.
- Richer Story Mode checkpoints.
- Stronger empty states with direct starter actions.

## Design

StudyMate should feel like a study coach, not a generic admin dashboard. The interface stays clean and practical, but uses more product-specific labels: readiness, weak areas, source trust, study path, and Matey guidance.

The recommendations engine is deterministic for the MVP. It reads existing course metrics and returns ranked actions such as upload material, build the wiki, extract key points, review flashcards, practice past questions, take a quiz, or export the revision PDF. This avoids adding a new AI dependency while still making the app feel proactive.

## Data Model

No schema changes are required. The MVP uses:

- `courses`
- `materials`
- `notes`
- `wiki_pages`
- `key_points`
- `flashcards`
- `past_questions`
- `quiz_attempts`

## User Experience

Dashboard:
Shows the most important next action, weak areas, progress, and onboarding actions when the account is empty.

Recommendations:
Shows ranked actions grouped by course, weak areas, and suggested study path.

Course overview:
Shows the Upload -> Learn -> Practice -> PDF path with status, plus source trust and weak-area prompts.

Navigation:
Adds direct access to Recommendations, Study Plan, and Revision PDFs.

Story Mode:
Shows clearer checkpoint steps and source-grounding expectations so it feels interactive even before deeper game-like behavior is added.

## Acceptance Criteria

- `/dashboard` renders the real dashboard shell instead of redirecting to `/demo`.
- `/recommendations` contains real recommendation cards instead of placeholder text.
- Course overview displays a progress map and next action.
- Empty course states contain direct starter actions.
- Source panels communicate confidence and grounding.
- No new database migrations are needed.
