# StudyMate — Unified Context for All AI Models

> Paste this at the start of every AI session.
> This is the ONLY context file. Do not reference COPILOT_CONTEXT(new).md or HACKATHON_CONTEXT.md — this supersedes both.

---

## What is StudyMate?

StudyMate is an AI-powered study companion that turns boring school materials — PDFs, textbooks, articles, journals, lecture notes, scanned handwritten pages — into an interactive learning path with exam-ready outputs.

**One-sentence pitch:**
> Upload your material. Learn it as a story or plain explanation. Practice exam questions from it. Leave with a revision PDF.

**Target user:** University students preparing for exams, tests, or assignments. Works for ANY subject, ANY university.

---

## Core User Problem

Students must read through multiple textbooks, articles, journals, and lecture notes before they can answer exam questions. This is slow, boring, and overwhelming. StudyMate makes the material usable immediately.

---

## The One Workflow

Every feature must serve this single guided workflow. If a feature does not support this loop, it is hidden or deferred.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  1. UPLOAD         → Drop course material               │
│       ↓                                                 │
│  2. LEARN          → Plain Mode or Story Mode           │
│       ↓              (with "Jump to Exam Prep" visible) │
│  3. EXAM PREP      → Practice questions + feedback      │
│       ↓                                                 │
│  4. REWARD          → XP + unlock Revision PDF          │
│       ↓                                                 │
│  5. REVISION PDF   → Download exam-ready document       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Step 1: Upload
- Student uploads PDFs, textbook chapters, lecture notes, articles, journals, scanned notes, or pasted text.
- Behind the scenes: OCR extracts text → ProfilingAgent classifies subject → WikiAgent builds structured wiki pages → knowledge compounds.
- User-facing copy: "Drop your course material here. StudyMate will turn it into explanations, exam practice, flashcards, and a revision PDF."
- The user should NOT see or understand the backend pipeline.

### Step 2: Learn (Explainer)
Two modes, toggled with a prominent segmented control:

**Plain Mode:**
- Explains concepts directly in simple language.
- Uses headings, short paragraphs, key points, and exam tips.
- Pulls facts from uploaded materials via the wiki.
- No storytelling. Direct academic explanations.
- Best for: "Explain negligence", "Summarize chapter 3", "What are the key principles?"

**Story Mode** (the product hook):
- Converts the material into a scenario or storyline.
- Uses characters, conflict, decisions, and consequences.
- Teaches the concept THROUGH the story. Ends with a short academic takeaway.
- Must preserve correctness from the uploaded material.
- Subject-aware stories:
  - Law → courtroom/client scenarios
  - Medicine → patient cases
  - Engineering → design/failure scenarios
  - Economics → policy/business scenarios
  - Other → everyday situations
- Story Mode must NOT become entertainment only. It always teaches.

**"Jump to Exam Prep" must be visible at all times during Learn.**

### Step 3: Exam Prep
- From Story Mode → scenario-based questions (apply the concept to real-life cases)
- From Plain Mode → direct exam-style questions with structured answers
- Student answers inside the app.
- App provides: score/readiness feedback, what was correct, what's missing, a better exam-ready version, suggested flashcards from weak points.
- Flashcards are NOT a separate destination. They are generated from key points and weak areas during Exam Prep.

### Step 4: XP and Reward
- XP makes progress visible but keeps it light (not gamification overload).
- +10 XP for answering a question, +20 for improving, +30 for completing a set, bonus for flashcard mastery.
- At the end, the student unlocks the Revision PDF.

### Step 5: Revision PDF
The PDF includes:
- Topic summary
- Plain explanation
- Story Mode takeaway (if used)
- Exam-ready answers
- Key points
- Flashcards
- Weak areas to revise

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Frontend | Next.js 16 (App Router) + Tailwind CSS v4 | TypeScript |
| Auth + DB | Supabase | Free tier |
| File Storage | Supabase Storage | Free tier |
| OCR | Azure Document Intelligence | Handles typed + scanned + handwritten |
| AI Agents | Azure OpenAI (GPT-5.4 / GPT-5.4-mini) | 3-tier model routing |
| PDF Report | jsPDF + jspdf-autotable | Client-side generation |
| Validation | Zod | Schema validation on all AI responses |
| Testing | Vitest + Playwright | Unit + E2E |

---

## Architecture: The Wiki Backbone

### Why Not Plain RAG?
Traditional RAG re-reads raw documents on every query. No memory. Knowledge never compounds.

### How StudyMate Does It
When material is uploaded, WikiAgent runs ONCE and builds structured wiki pages. All other agents query the wiki — not the raw document.

```
Upload PDF → OCR extracts text → WikiAgent structures into wiki pages
                                        ↓
                        Wiki pages stored in Supabase
                                        ↓
               All agents query wiki pages (faster, structured, connected)
```

### Three Layers
```
Layer 1 — Raw sources:   Original uploaded files (immutable, Supabase Storage)
Layer 2 — Wiki:          LLM-structured markdown pages (cross-referenced)
Layer 3 — Schema:        Config telling agents how to behave per subject type
```

### Wiki Page Structure
```markdown
# [Concept Name]
**Type**: principle | case | formula | definition | maxim | concept
**Subject**: law | engineering | medicine | economics | other

## Summary
[2-3 sentence summary]

## Detail
[Full explanation]

## Related concepts
- → [Linked concept 1]
- → [Linked concept 2]

## Exam tip
[How this appears in exams]

## Source
[Which uploaded material this came from]
```

---

## Multi-Agent Pipeline

Agents run behind the scenes. Users do NOT see agent names or pipeline terminology.

```
1. OCRAgent          → Extracts text from uploaded files (Azure Document Intelligence)
2. ProfilingAgent    → Detects subject type (law/engineering/medicine/economics/other)
3. WikiAgent         → Builds structured wiki pages from extracted text
4. NotesAgent        → Generates revision notes from wiki pages
5. KeyPointsAgent    → Extracts subject-specific important points from wiki
6. FlashcardAgent    → Converts key points into flashcard format
7. PastQAgent        → Answers exam questions with citations from wiki
8. AOCAgent          → Generates exam-ready answer per topic from wiki
9. QuizAgent         → Builds MCQ + essay questions from wiki
10. QuizGrader       → Grades essay answers fairly
11. GuardrailsAgent  → Validates ALL outputs (confidence: high/medium/low)
```

### Model Tiers
```
light:    gpt-5.4-mini (profiling, simple classification)
standard: gpt-5.4      (flashcards, guardrails, grading)
complex:  gpt-5.4      (wiki building, notes, answers, quizzes)
```
Each tier has a fallback model. If primary fails, fallback is attempted automatically.

### Guardrails Pattern
```
Generate answer → Guardrails check against wiki → 
  HIGH confidence   → show with green badge ✅
  MEDIUM confidence → show with amber warning ⚠️
  LOW confidence    → regenerate with strict mode → check again → show result
```

---

## Subject-Aware Extraction

| Subject | What Gets Extracted |
|---|---|
| Law | Legal principles · Supporting cases (Facts/Held/Ratio) · Latin maxims |
| Engineering | Formulas · Units · Derivations · When to apply |
| Medicine | Drugs · Dosages · Contraindications · Mnemonics |
| Economics | Theories · Key economists · Definitions · Important graphs |
| Other | Key definitions · Important exam concepts |

---

## Education Level Awareness

All prompts adapt based on education level:

| Level | Tone |
|---|---|
| Primary | Very simple language, short, vivid, safe |
| Secondary | Clear language, moderate detail, practical |
| Tertiary | Formal academic, full analysis, exam-ready |

---

## Database Schema (Supabase)

```sql
courses        (id, user_id, name, subject_type, description, readiness_score, created_at)
materials      (id, course_id, file_name, file_url, file_type, file_size, storage_path, 
                mime_type, ocr_status, ocr_progress, ocr_text, error_message, indexed, created_at)
wiki_pages     (id, course_id, title, type, content, related_pages, source_material, created_at)
notes          (id, course_id, content, generated_at, edited_at)
key_points     (id, course_id, type, title, content, source_material, created_at)
flashcards     (id, course_id, key_point_id, front, back, status, key_point_type, created_at)
past_questions (id, course_id, question, answer, confidence, warning_message, source_pages, created_at)
aoc_answers    (id, course_id, topic, answer, confidence, warning_message, created_at)
quiz_questions (id, course_id, quiz_session_id, type, question, options, correct_answer,
                explanation, model_answer, key_points, marks, topic, source_material)
quiz_attempts  (id, course_id, quiz_session_id, quiz_type, question_count, score, max_score,
                percentage, grade, feedback, strengths, improvements, key_points_covered,
                key_points_missed, questions_snapshot, answers_snapshot, created_at)
```

---

## Simplified Navigation

The app uses these main destinations:

| Destination | Purpose |
|---|---|
| Home / Landing | Marketing page + "Try Demo" + sign up |
| Upload | Drop course material |
| Learn | Plain Mode / Story Mode with "Jump to Exam Prep" |
| Exam Prep | Practice questions, feedback, flashcards, XP |
| Revision PDF | Download the final study report |
| Demo | Judge-friendly walkthrough, no API keys needed |

Inside **Learn**, allow switching between Plain Mode and Story Mode.
Inside **Exam Prep**, include questions, answer feedback, exam-ready answers, XP, and flashcards.

**DO NOT** expose these as separate competing destinations in the primary navigation:
- Wiki browser
- AOC as a standalone page
- Key Points as a standalone page
- Notes as a standalone page
- Study Plan
- Recommendations
- Podcast

These features may exist internally but are folded into the Learn and Exam Prep views.

---

## Existing Codebase Structure

```
studymate/
├── app/
│   ├── (auth)/login, signup
│   ├── (dashboard)/courses/[courseId]/...   ← full course sub-pages
│   ├── api/agents/...                       ← all agent API routes
│   ├── api/ocr, upload, report, auth
│   ├── demo/page.tsx                        ← judge demo page
│   └── page.tsx                             ← landing page
├── components/
│   ├── aoc, course, flashcards, key-points, materials, notes,
│   │   past-questions, quiz, readiness, report, shared, wiki
├── lib/
│   ├── answer-agents.ts       ← past question + AOC generation with guardrails
│   ├── azure-doc-intelligence.ts
│   ├── course-utils.ts
│   ├── demo-data.ts           ← preloaded Law of Torts demo data
│   ├── model-map.ts           ← 3-tier model routing config
│   ├── notes-agent.ts
│   ├── openai.ts              ← Azure OpenAI client with fallback chain
│   ├── pdf.ts                 ← 446-line PDF report generator
│   ├── prompts.ts             ← 858 lines of subject-aware prompts
│   ├── quiz-agent.ts          ← quiz generation + grading
│   ├── readiness.ts
│   ├── story-mode.ts          ← subject-aware story guide metadata
│   ├── supabase*.ts           ← client/server/admin Supabase clients
│   └── ...
├── types/index.ts              ← all TypeScript type definitions
└── tests/, e2e/
```

---

## AI Behavior Rules

### Grounding
- Every AI output MUST be grounded in uploaded material when available.
- If material is insufficient, say what is missing and give a cautious answer.
- Never fabricate citations, cases, formulas, or facts not in the wiki.

### Plain Mode Outputs
- Be clear, direct, and exam-focused.
- Use short sections with headings.
- Include key points and exam tips.
- No storytelling.

### Story Mode Outputs
- Create a relevant scenario grounded in the material.
- Teach through the scenario.
- End with "What this means for exams."
- Do NOT sacrifice accuracy for drama.
- Keep the story tightly anchored to wiki pages.

### Exam Prep Outputs
- Ask one question at a time unless user requests a set.
- Grade the answer constructively.
- Show a stronger exam-ready version.
- Generate flashcards from missed points.

### JSON Responses
- When returning JSON, return ONLY valid JSON.
- No markdown fences, no commentary, no preamble.
- Always include exactly the keys specified in the prompt.
- Use allowed enum values only.

---

## Product Language

### Use These Phrases (User-Facing)
- "Turn this into a story"
- "Explain it plainly"
- "Jump to Exam Prep"
- "Practice from this material"
- "Improve my answer"
- "Unlock revision PDF"
- "Exam-ready answer"

### Never Use These (Implementation Details)
- "Multi-agent pipeline"
- "AOC"
- "Knowledge graph"
- "LLM wiki"
- "RAG"
- "Guardrails agent"
- "WikiAgent"
- "ProfilingAgent"

---

## Demo Mode

Demo mode runs entirely without Supabase calls or external API calls. It uses preloaded data from `lib/demo-data.ts` (Law of Torts — 300L).

Demo includes:
- Preloaded wiki pages, notes, key points, flashcards, quiz questions, past question answers, AOC answers
- Simulated pipeline progression animation
- Story Mode and Plain Mode toggle
- Readiness score ring
- PDF report preview and download

Demo must be understandable by a judge in under 90 seconds.

---

## Exam Readiness Score

```
Score = (
  quiz_correct / quiz_total               × 0.35 +
  past_questions_answered / total          × 0.35 +
  flashcards_mastered / total_flashcards   × 0.20 +
  topics_covered / total_topics            × 0.10
) × 100
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_KEY=
OPENAI_API_VERSION=2024-10-21

# Model overrides (optional)
STUDYMATE_MODEL_LIGHT=gpt-5.4-mini
STUDYMATE_MODEL_STANDARD=gpt-5.4
STUDYMATE_MODEL_COMPLEX=gpt-5.4
STUDYMATE_MODEL_FALLBACK=gpt-chat-latest

# Azure Document Intelligence (OCR)
AZURE_DOC_INTELLIGENCE_ENDPOINT=
AZURE_DOC_INTELLIGENCE_KEY=

# Demo mode
NEXT_PUBLIC_DEMO_MODE=true
```

---

## Coding Standards

### TypeScript
- All types defined in `types/index.ts`.
- Use `type` imports where possible.
- Zod validation on all AI JSON responses.
- No `any` types.

### Components
- One component per file.
- Use `"use client"` only when state or effects are needed.
- Keep components under 200 lines. Break up larger ones.
- Place shared UI in `components/shared/`.

### API Routes
- All agent routes under `app/api/agents/`.
- Always validate request body with Zod.
- Always return proper error responses with status codes.
- Use `supabaseAdmin` for server-side DB operations.

### Prompts
- All prompts defined in `lib/prompts.ts`.
- System prompts are arrays joined with `\n`.
- User prompts are builder functions that accept typed parameters.
- Cap material text at reasonable limits (5000-12000 chars) to manage token costs.

### Error Handling
- Always handle LLM failures gracefully (the model may return null).
- Use toast notifications for user-facing errors.
- Log errors server-side with `console.error`.

---

## Session Starters

Start every session with:
```
#file:CONTEXT.md

Today I want to build: [feature name]
```

Examples:
- "Today I want to build the unified Learn page with Plain/Story toggle"
- "Today I want to build the Exam Prep flow with feedback and XP"
- "Today I want to build the Revision PDF reward moment"
- "Today I want to wire up the upload → wiki → learn pipeline"
- "Today I want to polish the demo for judges"
