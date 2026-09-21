# StudyMate — Master Project Context v4
> Paste this at the start of every GitHub Copilot session.
> Always reference with #file:COPILOT_CONTEXT.md before asking anything.

---

## What is StudyMate?
StudyMate is an AI-powered study companion for university students.
Students upload their own course materials (PDFs, textbooks, handwritten notes, scanned papers)
and the app helps them study smarter through a multi-agent AI pipeline.
Works for ANY student, ANY subject, ANY university worldwide.

---

## Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | Free |
| Auth + Database | Supabase | Free tier |
| File Storage | Supabase Storage | Free tier |
| OCR / Handwriting | Azure Document Intelligence | Free (500 pages/mo) |
| Wiki Processing | Azure OpenAI GPT-4o | Free credits |
| Knowledge Retrieval | Microsoft Foundry IQ | Free credits |
| All AI Agents | Azure OpenAI GPT-4o | Free credits |
| Podcast TTS | Azure Speech Service | Free tier |
| PDF Report | jsPDF (npm) | Free forever |
| Deployment | Vercel | Free tier |
| CI/CD | GitHub Actions | Free tier |
| Dev tool | GitHub Copilot (required for contest) | Free with student plan |

---

## Folder Structure
```
studymate/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                      ← sidebar + nav shell
│   │   ├── dashboard/page.tsx              ← home + exam readiness score
│   │   ├── courses/
│   │   │   ├── page.tsx                    ← all courses list
│   │   │   ├── new/page.tsx                ← create new course
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx                ← course overview
│   │   │       ├── materials/page.tsx      ← upload + view files
│   │   │       ├── wiki/page.tsx           ← LLM Wiki pages viewer
│   │   │       ├── notes/page.tsx          ← AI generated notes
│   │   │       ├── key-points/page.tsx     ← principles, cases, formulas
│   │   │       ├── flashcards/page.tsx     ← swipeable study cards
│   │   │       ├── past-questions/page.tsx ← drop question, get answer
│   │   │       ├── aoc/page.tsx            ← topic list → exam answers
│   │   │       ├── quiz/page.tsx           ← MCQ + essay quiz
│   │   │       ├── podcast/page.tsx        ← audio summaries
│   │   │       └── report/page.tsx         ← download PDF study report
│   │   ├── study-plan/page.tsx
│   │   └── recommendations/page.tsx
│   ├── api/
│   │   ├── agents/
│   │   │   ├── profiling/route.ts          ← detects subject type
│   │   │   ├── wiki/route.ts               ← LLM Wiki builder (NEW)
│   │   │   ├── notes/route.ts
│   │   │   ├── key-points/route.ts
│   │   │   ├── flashcards/route.ts
│   │   │   ├── past-question/route.ts
│   │   │   ├── aoc/route.ts
│   │   │   ├── quiz/route.ts
│   │   │   ├── study-plan/route.ts
│   │   │   ├── recommendations/route.ts
│   │   │   └── guardrails/route.ts
│   │   ├── ocr/route.ts                    ← Azure Document Intelligence (NEW)
│   │   ├── podcast/generate/route.ts       ← Azure Speech TTS
│   │   ├── report/generate/route.ts        ← jsPDF report
│   │   └── upload/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── course/
│   ├── materials/
│   ├── wiki/                               ← wiki page viewer cards (NEW)
│   ├── notes/
│   ├── key-points/
│   ├── flashcards/                         ← flip card + swipe tracker
│   ├── quiz/
│   ├── past-questions/
│   ├── aoc/
│   ├── podcast/
│   ├── report/
│   ├── readiness/                          ← exam readiness score ring
│   └── shared/                             ← sidebar, navbar, loader
├── lib/
│   ├── supabase.ts
│   ├── foundry.ts                          ← Foundry IQ client
│   ├── openai.ts                           ← Azure OpenAI client
│   ├── azure-speech.ts                     ← Azure Speech TTS
│   ├── azure-doc-intelligence.ts           ← OCR + handwriting (NEW)
│   ├── pdf.ts                              ← jsPDF helpers
│   └── prompts.ts                          ← all AI prompt templates
├── hooks/
│   ├── useCourse.ts
│   ├── useMaterials.ts
│   ├── useWiki.ts                          ← NEW
│   ├── useNotes.ts
│   ├── useFlashcards.ts
│   ├── useQuiz.ts
│   └── useReadiness.ts
├── types/index.ts
├── .env.local
└── README.md
```

---

## Complete Feature List

### Core Features
| Feature | Description |
|---|---|
| Course creator | Student creates a course, uploads PDFs, notes, textbooks, handwritten scans |
| OCR + Handwriting reader | Azure Document Intelligence reads scanned notes and handwritten pages |
| LLM Wiki builder | On upload, AI builds structured wiki pages from materials — knowledge compounds |
| Note generator | AI reads wiki pages → structured markdown notes |
| Podcast mode | Converts notes to audio via Azure Speech for on-the-go revision |
| Material recommendations | Suggests additional reading based on course content |
| Study plan agent | Exam date → AI builds daily revision schedule |

### Intelligence Features
| Feature | Description |
|---|---|
| Key points extractor | Subject-aware: law gets cases+maxims, engineering gets formulas etc. |
| Flashcard mode | Key points become swipeable flip cards. Tracks "Got it" vs "Review again" |
| Past question engine | Paste past exam question → structured cited exam-ready answer |
| AOC agent | Paste topic list → exam-ready answer per topic |
| Quiz me | Generates MCQ (4 options + explanation) and essay questions |

### Quality + Output Features
| Feature | Description |
|---|---|
| Guardrails agent | Double-checks all answers. Flags uncertain cases. Shows confidence level |
| Exam readiness score | Live % score: quiz + past Q + flashcards + topics covered |
| PDF study report | Downloadable: notes + key points + quiz scores + study plan |

---

## LLM Wiki Layer (Karpathy Pattern) — HOW IT WORKS

This is the core architectural innovation in StudyMate.

### The Problem With Plain RAG
Traditional RAG re-reads raw documents from scratch on every query.
It has no memory. Knowledge never compounds. Every question starts from zero.

### How StudyMate Does It Better
When a student uploads a material, the WikiAgent runs ONCE and builds structured pages:

```
Student uploads "Law of Torts.pdf"
            ↓
Azure Document Intelligence extracts text (handles scanned/handwritten too)
            ↓
WikiAgent reads the extracted text and creates structured wiki pages:

  📄 Page: "Negligence"
     Definition: ...
     Elements: duty of care, breach, causation, damage
     Key cases: Donoghue v Stevenson, Caparo v Dickman
     Related pages: → Duty of Care, → Remoteness

  📄 Page: "Donoghue v Stevenson"
     Facts: Mrs Donoghue found a snail in her ginger beer...
     Held: ...
     Principle established: Neighbour principle
     Related pages: → Negligence, → Duty of Care

  📄 Page: "Neighbour Principle"
     Maxim: ...
     Origin: Lord Atkin in Donoghue v Stevenson
     Modern application: ...
     Related pages: → Negligence

            ↓
Wiki pages stored in Supabase as structured markdown
            ↓
Foundry IQ indexes the wiki pages (not raw PDFs)
            ↓
All agents query the WIKI — not the raw document
            ↓
Answers are faster, more connected, more accurate
```

### Three Layers (Karpathy's Pattern)
```
Layer 1 — Raw sources:   Original uploaded files (immutable, stored in Supabase)
Layer 2 — Wiki:          LLM-maintained structured markdown pages (cross-referenced)
Layer 3 — Schema:        Configuration telling agents how to behave per subject type
```

### Wiki Page Structure
```markdown
# [Concept Name]
**Type**: principle | case | formula | definition | maxim
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

```
1. OCRAgent          → Azure Document Intelligence reads uploaded file
2. WikiAgent         → Builds structured wiki pages from extracted text
3. ProfilingAgent    → Detects subject type (law/engineering/medicine/other)
4. NotesAgent        → Generates structured notes from wiki pages
5. KeyPointsAgent    → Extracts subject-specific important points from wiki
6. FlashcardAgent    → Converts key points into flip card format
7. PastQAgent        → Answers exam questions with citations from wiki
8. AOCAgent          → Generates exam-ready answer per topic from wiki
9. QuizAgent         → Builds MCQ + essay questions from wiki
10. StudyPlanAgent   → Creates daily revision schedule from exam date
11. GuardrailsAgent  → Validates ALL outputs from every other agent
```

---

## Azure Document Intelligence — OCR Setup

```typescript
// lib/azure-doc-intelligence.ts
import { DocumentAnalysisClient, AzureKeyCredential } from "@azure/ai-form-recognizer"

const client = new DocumentAnalysisClient(
  process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT!,
  new AzureKeyCredential(process.env.AZURE_DOC_INTELLIGENCE_KEY!)
)

export async function extractTextFromFile(fileUrl: string): Promise<string> {
  // Uses "prebuilt-read" model — handles:
  // ✅ Typed PDFs
  // ✅ Scanned documents
  // ✅ Handwritten notes
  // ✅ Mixed typed + handwritten
  const poller = await client.beginAnalyzeDocumentFromUrl("prebuilt-read", fileUrl)
  const result = await poller.pollUntilDone()

  return result.content || ""
}
```

Install with:
```bash
npm install @azure/ai-form-recognizer
```

---

## Azure Speech Service — Podcast TTS

```typescript
// lib/azure-speech.ts
export async function textToSpeech(text: string): Promise<Buffer> {
  const response = await fetch(
    `${process.env.AZURE_SPEECH_ENDPOINT}/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY!,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
      },
      body: `
        <speak version='1.0' xml:lang='en-US'>
          <voice name='en-US-JennyNeural'>${text}</voice>
        </speak>
      `,
    }
  )
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
```

---

## Key Points — Subject-Aware Extraction

| Subject | What gets extracted |
|---|---|
| Law | Legal principles · Supporting cases · Facts of each case · Latin maxims |
| Engineering | Formulas · Units · Derivations · When to apply |
| Medicine | Drug names · Dosages · Contraindications · Mnemonics |
| Economics | Theories · Key economists · Definitions · Important graphs |
| Any other | Key definitions · Important exam concepts |

---

## Flashcard Mode

- Front: principle name / case name / formula
- Back: full explanation + facts + exam tip
- Swipe right = "Got it", left = "Review again"
- Tracks which cards need more revision
- Feeds into Exam Readiness Score

---

## AOC Agent (Answer on Command)

Student pastes topic list:
```
Doctrine of frustration
Promissory estoppel
Privity of contract
```

For each topic, AOC agent returns from the wiki:
1. Definition
2. Key principle / rule
3. Supporting authority (case / statute / formula)
4. Exam application tip

---

## Guardrails Agent Logic

```typescript
interface GuardrailResult {
  confidence: 'high' | 'medium' | 'low'
  verified: boolean
  citations_found: boolean
  warning_message?: string
  should_retry: boolean
}
// HIGH   → show answer + green citation badge ✅
// MEDIUM → show answer + amber ⚠️ "Verify this independently"
// LOW    → retry with stricter prompt or refuse to answer
```

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

Shown as a ring chart on dashboard. Updates in real time.

---

## PDF Study Report Contents (jsPDF)

1. Course name + subject type
2. Summary of uploaded materials
3. Full AI-generated notes
4. Key points (organised by type)
5. Quiz results + wrong answers explained
6. Past questions + answers
7. Study plan schedule
8. Exam readiness score

---

## Database Schema (Supabase)

```sql
courses        (id, user_id, name, subject_type, description, created_at)
materials      (id, course_id, file_name, file_url, file_type, ocr_text, indexed, created_at)
wiki_pages     (id, course_id, title, type, content, related_pages, source_material, created_at)
notes          (id, course_id, content, generated_at, edited_at)
key_points     (id, course_id, type, title, content, source_material, created_at)
flashcards     (id, course_id, key_point_id, front, back, status, created_at)
past_questions (id, course_id, question, answer, confidence, created_at)
aoc_answers    (id, course_id, topic, answer, confidence, created_at)
quiz_questions (id, course_id, type, question, options, correct_answer, explanation)
quiz_attempts  (id, course_id, user_id, score, total, attempted_at)
study_plans    (id, course_id, exam_date, plan_json, created_at)
```

---

## Demo Mode (CRITICAL for contest judges)

```typescript
// lib/demo-data.ts
export const DEMO_COURSE = {
  name: "Law of Torts — 300L",
  subject_type: "law",
}

export const DEMO_WIKI_PAGES = [
  { title: "Negligence", type: "principle", content: "..." },
  { title: "Donoghue v Stevenson", type: "case", content: "..." },
  { title: "Volenti non fit injuria", type: "maxim", content: "..." },
]

export const DEMO_FLASHCARDS = [
  { front: "Neighbour Principle", back: "You must take reasonable care to avoid acts or omissions which you can reasonably foresee would be likely to injure your neighbour..." },
]

export const DEMO_PAST_QUESTION = "Discuss the tort of negligence with reference to decided cases."
```

Add a **"Try Demo"** button on login page — judges can test everything in under 60 seconds without signing up.

---

## Environment Variables (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_KEY=
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Microsoft Foundry IQ
FOUNDRY_IQ_ENDPOINT=
FOUNDRY_IQ_KEY=

# Azure Document Intelligence (OCR)
AZURE_DOC_INTELLIGENCE_ENDPOINT=
AZURE_DOC_INTELLIGENCE_KEY=

# Azure Speech (Podcast TTS)
AZURE_SPEECH_ENDPOINT=
AZURE_SPEECH_KEY=

# Demo mode
NEXT_PUBLIC_DEMO_MODE=true
```

---

## npm packages to install

```bash
npm install @azure/ai-form-recognizer    # Azure Document Intelligence
npm install jspdf jspdf-autotable        # PDF report generation
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install lucide-react react-markdown react-dropzone
npm install axios react-hot-toast react-loading-skeleton zod
```

---

## Build Order (10 sessions)

| Session | Feature |
|---|---|
| 1 | Project setup ✅ Done |
| 2 | Auth — login + signup + demo button |
| 3 | Dashboard layout + sidebar + readiness ring |
| 4 | Course creator + materials upload + OCR |
| 5 | Wiki builder + wiki viewer page |
| 6 | Notes generator + ProfilingAgent |
| 7 | Key points + Flashcard mode |
| 8 | Past Question Engine + AOC Agent |
| 9 | Quiz Me + Guardrails Agent |
| 10 | Podcast + PDF Report + Study Plan + Polish + Deploy |

---

## Session Copilot Starters

Start every session with:
```
#file:COPILOT_CONTEXT.md

Today I want to build: [feature name]
```

Examples:
- "Today I want to build the OCR upload flow using Azure Document Intelligence"
- "Today I want to build the WikiAgent that processes extracted text into structured pages"
- "Today I want to build the Flashcard component with flip animation"
- "Today I want to build the AOC Agent API route and page"
- "Today I want to build the Exam Readiness Score ring chart"
- "Today I want to build the PDF Study Report generator using jsPDF"
- "Today I want to build the Demo Mode with preloaded law data"
