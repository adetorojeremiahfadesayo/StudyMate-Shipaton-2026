# StudyMate Hackathon Context

Use this file as the product and implementation north star for StudyMate during the hackathon.

## One Sentence

StudyMate turns boring school materials, textbooks, articles, and notes into an interactive learning path: upload material, understand it in plain or story mode, practice exam-style questions, then earn an exam-ready revision PDF.

## Product Focus

The hackathon version must feel simple and memorable. Do not build StudyMate as a bundle of disconnected tools. Build it as one guided workflow:

1. Upload course material.
2. Choose how to learn: Plain Mode or Story Mode.
3. Study the generated explanation.
4. Jump into Exam Prep.
5. Answer practice questions.
6. Earn XP and unlock an exam-ready revision PDF.

Any feature that does not support this loop should be hidden, deferred, or folded into one of these steps.

## Core User Problem

Students often have to read multiple textbooks, articles, journals, PDFs, lecture notes, and scanned documents before they can answer exam questions properly. This is slow, boring, and overwhelming.

StudyMate should make the student's material usable immediately by converting it into explanations, practice, flashcards, and revision answers.

## Target User

University students preparing for exams, tests, tutorials, or assignments.

They want:

- Fast explanations from their own materials.
- Exam-ready answers, not generic AI summaries.
- Practice questions that feel like their course.
- Simple revision assets they can save and read later.

## Main Workflow

### 1. Upload

The student uploads PDFs, textbook chapters, lecture notes, articles, journals, scanned notes, or pasted text.

The app extracts the material and creates a course knowledge base. The user should not have to understand the backend pipeline.

User-facing copy:

> Drop your course material here. StudyMate will turn it into explanations, exam practice, flashcards, and a revision PDF.

### 2. Explainer

After upload, the student lands in the Explainer view.

The Explainer has two modes:

- Plain Mode
- Story Mode

Plain Mode explains topics directly and clearly when the student asks questions.

Story Mode converts the material into a storyline, scenario, or real-life situation that helps the student understand the topic.

The UI should keep "Jump to Exam Prep" visible so students can move from learning to practice at any point.

### 3. Plain Mode

Plain Mode is for direct academic explanations.

It should:

- Explain concepts in simple language.
- Use headings and short paragraphs.
- Pull facts from uploaded materials.
- Include key points and exam tips.
- Avoid over-storytelling.

Best for:

- "Explain negligence."
- "Summarize chapter 3."
- "What are the key principles?"
- "Give me an exam-ready answer for this question."

### 4. Story Mode

Story Mode is the product hook.

It should:

- Turn the material into a scenario or storyline.
- Use characters, conflict, decisions, and consequences where useful.
- Teach the concept through the story.
- End with a short academic takeaway.
- Preserve correctness from the uploaded material.

Best for:

- Law topics as courtroom/client scenarios.
- Medicine topics as patient cases.
- Engineering topics as design or failure scenarios.
- Economics topics as policy/business scenarios.
- General topics as everyday situations.

Story Mode must not become entertainment only. It should always teach the material.

### 5. Exam Prep

Exam Prep starts after the explanation, or when the student taps "Jump to Exam Prep."

The mode changes based on how the student learned:

- From Story Mode: ask scenario-based questions where the student applies the concept to real-life cases.
- From Plain Mode: ask direct exam-style questions and require structured answers.

The student answers inside the app.

The app grades or responds with:

- Score or readiness feedback.
- What the student got right.
- What is missing.
- A better exam-ready version.
- Suggested flashcards from weak points.

### 6. Flashcards

Flashcards are not a separate big feature in the hackathon flow. They are generated from key points and weak points during learning and Exam Prep.

Each flashcard should have:

- Front: concept, case, formula, definition, or question.
- Back: explanation, answer, exam tip, or memory cue.

Flashcards should support quick revision and feed into the XP/readiness score.

### 7. XP and Reward

After the student completes an Exam Prep session, they earn XP.

XP exists to make progress visible, not to turn the app into a game. Keep it light.

Examples:

- +10 XP for answering a question.
- +20 XP for improving an answer.
- +30 XP for completing a practice set.
- Bonus XP for mastering flashcards.

At the end, the student unlocks a reward:

> Exam-ready revision PDF

The PDF should include:

- Topic summary.
- Plain explanation.
- Story Mode takeaway if used.
- Exam-ready answers.
- Key points.
- Flashcards.
- Weak areas to revise.

## Hackathon Feature Priority

### Must Have

- Upload or paste material.
- Plain Mode explainer.
- Story Mode explainer.
- Jump to Exam Prep.
- Exam-style questions.
- Student answer input.
- Feedback and improved exam-ready answer.
- Flashcards generated from key points.
- XP completion moment.
- Revision PDF generation.

### Nice to Have

- Readiness score.
- Subject-aware story styles.
- Saved session history.
- Better OCR for scanned and handwritten documents.
- Course dashboard.

### Defer

- Podcast mode.
- Full study plan agent.
- Recommendation engine.
- Large wiki browsing interface.
- Too many separate pages for notes, AOC, past questions, key points, flashcards, and quiz.

These deferred features can still exist internally, but the user experience should not expose them as separate competing destinations during the hackathon demo.

## Simplified Navigation

Use fewer main destinations:

- Home or Dashboard
- Upload
- Learn
- Exam Prep
- Revision PDF

Inside Learn, allow switching between Plain Mode and Story Mode.

Inside Exam Prep, include questions, answer feedback, exam-ready answers, XP, and flashcards.

## Demo Flow for Judges

The demo must be understandable in under 90 seconds.

Recommended script:

1. Open StudyMate.
2. Upload or load demo course material.
3. Ask: "Explain negligence."
4. Switch to Story Mode and show a real-life scenario.
5. Tap "Jump to Exam Prep."
6. Answer a scenario or exam question.
7. Show feedback and improved exam-ready answer.
8. Show XP reward.
9. Download or preview the revision PDF.

## Product Language

Use clear, student-friendly language.

Good phrases:

- "Turn this into a story"
- "Explain it plainly"
- "Jump to Exam Prep"
- "Practice from this material"
- "Improve my answer"
- "Unlock revision PDF"
- "Exam-ready answer"

Avoid:

- "Multi-agent pipeline"
- "AOC"
- "Knowledge graph"
- "LLM wiki"
- "RAG"
- "Guardrails agent"

Those terms are implementation details, not user-facing product language.

## AI Behavior Rules

Every AI output should be grounded in uploaded material when available.

If the material is insufficient, say what is missing and give a cautious answer.

For Plain Mode:

- Be clear, direct, and exam-focused.
- Use short sections.
- Include key points.
- Include exam tips.

For Story Mode:

- Create a relevant scenario.
- Teach through the scenario.
- End with "What this means for exams."
- Do not sacrifice accuracy for drama.

For Exam Prep:

- Ask one question at a time unless the user requests a set.
- Grade the answer constructively.
- Show a stronger exam-ready version.
- Generate flashcards from missed points.

## Implementation Notes

The existing codebase already has many pieces:

- Materials upload.
- Story mode helpers.
- Past question answers.
- AOC answers.
- Quiz workspace.
- Key points.
- Flashcards.
- PDF report.
- Readiness/XP concepts.

For the hackathon, reuse these pieces but present them as one flow.

Suggested mapping:

- Upload page remains the source intake.
- Notes, wiki, and key points become the behind-the-scenes source for Learn.
- Past questions, AOC, and quiz collapse into Exam Prep.
- Flashcards become a supporting panel or reward, not a main destination.
- Report becomes the final revision PDF reward.

## Design Direction

The app should feel like a focused study workspace, not a marketing site.

Use:

- A clean upload area.
- A two-mode segmented control: Plain / Story.
- A visible "Jump to Exam Prep" action.
- A conversational answer area.
- A practice card for questions.
- A compact XP/reward panel.
- A PDF preview/download moment.

Avoid cluttered sidebars with many study tools during the hackathon demo.

## Success Criteria

StudyMate is successful if a judge can say:

> I uploaded boring course material, learned it as either a plain explanation or a story, practiced exam questions from it, and left with a revision PDF.

That is the product. Everything else is support.
