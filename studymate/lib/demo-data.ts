import type { AocAnswer, Flashcard, KeyPoint, PastQuestion, QuizQuestion, SubjectType, WikiPageType } from "@/types";

export const DEMO_COURSE = {
  id: "demo-course-1",
  name: "Law of Torts — 300L",
  subject_type: "law" as SubjectType,
  description: "Third year Law of Torts course",
  created_at: "2026-04-18T09:00:00.000Z",
};

export const DEMO_MICROSOFT_TOOLS = [
  "Foundry IQ",
  "Azure OpenAI",
  "Azure Document Intelligence",
  "Azure Speech",
  "GitHub Copilot",
];

export const DEMO_STATS = {
  agents: 11,
  tools: 4,
  features: 7,
};

export const DEMO_GUIDED_TOUR_STEPS = [
  {
    title: "Wiki",
    description: "Turn uploaded materials into a structured study wiki.",
  },
  {
    title: "Past Q",
    description: "Answer past questions from the wiki with grounded exam flow.",
  },
  {
    title: "AOC",
    description: "Generate answer-on-command topic packs in one pass.",
  },
  {
    title: "Key Points",
    description: "Extract the highest-value rules, cases, and formulas.",
  },
  {
    title: "Flashcards",
    description: "Convert key points into mastery-tracked flashcards.",
  },
  {
    title: "Readiness Score",
    description: "Track how ready the student is to sit the exam.",
  },
];

export const DEMO_AGENT_LOG = [
  {
    id: "upload",
    label: "OCR upload",
    tool: "Azure Document Intelligence",
    detail: "PDFs and scans are read into text.",
  },
  {
    id: "profile",
    label: "Subject profiling",
    tool: "gpt-5.4-mini",
    detail: "The course is classified as Law.",
  },
  {
    id: "wiki",
    label: "Wiki builder",
    tool: "gpt-5.4",
    detail: "Materials become structured wiki pages.",
  },
  {
    id: "past",
    label: "Past question engine",
    tool: "gpt-5.4 + guardrails",
    detail: "Answers stay grounded in the wiki.",
  },
  {
    id: "aoc",
    label: "AOC agent",
    tool: "gpt-5.4 + guardrails",
    detail: "Topics become exam-ready answers.",
  },
  {
    id: "quiz",
    label: "Quiz engine",
    tool: "gpt-5.4 + grading",
    detail: "MCQs and essays are generated and scored.",
  },
  {
    id: "report",
    label: "PDF study report",
    tool: "jsPDF",
    detail: "All progress is compiled into a final report.",
  },
];

export const DEMO_STORY_SCRIPTS = {
  law: {
    pastQuestion: {
      clientBubble:
        "Client: I bought ginger beer and found a decomposed snail in the bottle. What rights do I have?",
      studentPrompt: "Spot the issues in this negligence scenario.",
      outcome: "Victory: You spotted duty, breach, causation, and the neighbour principle.",
    },
    aoc: {
      intro: "Topic deck: negligence, occupiers liability, nuisance, trespass to person.",
      victory: "Story XP unlocked: the law guide trusts your issue spotting.",
    },
  },
} as const;

export const DEMO_MATERIALS = [
  { file_name: "Law of Torts Lecture Notes.pdf", created_at: "2026-04-20T10:00:00.000Z" },
  { file_name: "Torts Cases Handout.pdf", created_at: "2026-04-21T11:30:00.000Z" },
  { file_name: "Past Questions Pack.pdf", created_at: "2026-04-25T08:45:00.000Z" },
];

export const DEMO_WIKI_PAGES: Array<{
  title: string;
  type: WikiPageType;
  content: string;
  source_material: string;
}> = [
  {
    title: "Negligence",
    type: "principle",
    content: "## Definition\nNegligence is the failure to exercise reasonable care...\n## Application\nIt is tested by duty, breach, causation, and damage.",
    source_material: "Law of Torts Lecture Notes.pdf",
  },
  {
    title: "Donoghue v Stevenson [1932]",
    type: "case",
    content: "## Facts\nMrs Donoghue consumed ginger beer...\n## Held\nThe manufacturer owed a duty of care...\n## Ratio\nNeighbour principle.\n## Significance\nFoundation of modern negligence.",
    source_material: "Torts Cases Handout.pdf",
  },
  {
    title: "Volenti non fit injuria",
    type: "maxim",
    content: "## Translation\nTo a willing person, no injury is done.\n## Meaning\nA claimant who freely consents cannot later complain.",
    source_material: "Law of Torts Lecture Notes.pdf",
  },
  {
    title: "Duty of Care",
    type: "principle",
    content: "## Definition\nA legal obligation to avoid reasonably foreseeable harm.\n## Caparo Test\nForeseeability, proximity, and fairness.\n## Application\nUsed to test whether liability should arise.",
    source_material: "Law of Torts Lecture Notes.pdf",
  },
];

export const DEMO_NOTES = `# Law of Torts Revision Notes

## Negligence
### Definition
Negligence is a tort based on a failure to take reasonable care.

### Key Principles
- Duty of care
- Breach
- Causation
- Damage

### Relevant Cases
- **Donoghue v Stevenson**: facts, held, and significance

### Exam Tips
- Always identify the issue.
- Apply the facts to each element.

## Duty of Care
### Definition
The duty to take reasonable care to avoid foreseeable harm.

### Key Principles
- Foreseeability
- Proximity
- Fair, just and reasonable
`;

export const DEMO_KEY_POINTS: KeyPoint[] = [
  {
    id: "kp-1",
    course_id: DEMO_COURSE.id,
    type: "case",
    title: "Donoghue v Stevenson [1932]",
    content: "Facts: Mrs Donoghue consumed ginger beer... Held: duty of care owed... Significance: neighbour principle.",
    source_material: "Torts Cases Handout.pdf",
    created_at: "2026-04-25T12:00:00.000Z",
  },
  {
    id: "kp-2",
    course_id: DEMO_COURSE.id,
    type: "principle",
    title: "Neighbour Principle",
    content: "You must take reasonable care to avoid acts or omissions which you can reasonably foresee would be likely to injure your neighbour.",
    source_material: "Law of Torts Lecture Notes.pdf",
    created_at: "2026-04-25T12:05:00.000Z",
  },
  {
    id: "kp-3",
    course_id: DEMO_COURSE.id,
    type: "maxim",
    title: "Volenti non fit injuria",
    content: "A person cannot claim damages for harm they voluntarily accepted.",
    source_material: "Law of Torts Lecture Notes.pdf",
    created_at: "2026-04-25T12:10:00.000Z",
  },
];

export const DEMO_FLASHCARDS: Flashcard[] = [
  {
    id: "fc-1",
    course_id: DEMO_COURSE.id,
    key_point_id: "kp-2",
    front: "What is the neighbour principle?",
    back: "Lord Atkin in Donoghue v Stevenson said you must take reasonable care to avoid acts or omissions likely to injure your neighbour.",
    status: "mastered",
    key_point_type: "principle",
    created_at: "2026-04-25T12:20:00.000Z",
  },
  {
    id: "fc-2",
    course_id: DEMO_COURSE.id,
    key_point_id: "kp-1",
    front: "What are the elements of negligence?",
    back: "Duty of care, breach of duty, causation, and damage.",
    status: "review",
    key_point_type: "case",
    created_at: "2026-04-25T12:21:00.000Z",
  },
];

export const DEMO_PAST_QUESTION: PastQuestion = {
  id: "pq-1",
  course_id: DEMO_COURSE.id,
  question: "Discuss the tort of negligence with reference to relevant decided cases.",
  answer:
    "## Introduction\nNegligence is a tort that protects people from careless harm.\n\n## Legal Framework\nThe claimant must show duty, breach, causation, and damage.\n\n## Case Authorities\n- **Donoghue v Stevenson**: established the neighbour principle.\n\n## Analysis\nApply each element to the facts in issue.\n\n## Conclusion\nThe defendant will be liable if all elements are proved.",
  confidence: "high",
  warning_message: null,
  source_pages: ["Negligence", "Donoghue v Stevenson [1932]"],
  created_at: "2026-04-25T13:00:00.000Z",
};

export const DEMO_AOC_TOPICS = ["Negligence", "Occupiers Liability", "Nuisance", "Trespass to Person"];

export const DEMO_AOC_ANSWERS: AocAnswer[] = [
  {
    id: "aoc-1",
    course_id: DEMO_COURSE.id,
    topic: "Negligence",
    answer:
      "## Negligence\n\n**Definition**\nA failure to exercise reasonable care.\n\n**Key Principle / Rule**\nThe defendant owes a duty of care, breaches it, and causes damage.\n\n**Supporting Authority**\n- *Donoghue v Stevenson* established the neighbour principle.\n\n**Exam Application Tip**\nAlways structure the answer by duty, breach, causation, and damage.",
    confidence: "high",
    warning_message: null,
    created_at: "2026-04-25T13:20:00.000Z",
  },
];

export const DEMO_QUIZ: QuizQuestion[] = [
  {
    id: "quiz-1",
    course_id: DEMO_COURSE.id,
    type: "mcq",
    question: "Which case established the neighbour principle?",
    options: [
      { label: "A", text: "Caparo v Dickman", correct: false },
      { label: "B", text: "Donoghue v Stevenson", correct: true },
      { label: "C", text: "Hedley Byrne v Heller", correct: false },
      { label: "D", text: "Bolton v Stone", correct: false },
    ],
    correct_answer: "B",
    explanation: "Donoghue v Stevenson established the neighbour principle in negligence.",
    topic: "Negligence",
    source_material: "Law of Torts Lecture Notes.pdf",
  },
];

export const DEMO_QUIZ_ATTEMPTS = [
  {
    id: "qa-1",
    course_id: DEMO_COURSE.id,
    quiz_session_id: "quiz-session-1",
    quiz_type: "mixed" as const,
    percentage: 78,
    grade: "B" as const,
    question_count: 10,
    score: 39,
    max_score: 50,
    created_at: "2026-04-26T15:00:00.000Z",
  },
  {
    id: "qa-2",
    course_id: DEMO_COURSE.id,
    quiz_session_id: "quiz-session-2",
    quiz_type: "mcq" as const,
    percentage: 84,
    grade: "A" as const,
    question_count: 5,
    score: 21,
    max_score: 25,
    created_at: "2026-04-27T11:30:00.000Z",
  },
];

export const DEMO_READINESS_BREAKDOWN = {
  quiz: 27,
  pastQuestions: 35,
  flashcards: 10,
  topics: 10,
  overall: 68,
};

export const DEMO_READINESS_SCORE = 68;

export const DEMO_REPORT_SUMMARY = {
  materials: DEMO_MATERIALS,
  wikiCountsByType: {
    principle: 2,
    case: 1,
    formula: 0,
    maxim: 1,
    definition: 0,
    concept: 0,
  } satisfies Record<WikiPageType, number>,
  notesCount: 1,
  keyPointsCount: DEMO_KEY_POINTS.length,
  pastQuestionsAnsweredCount: 1,
  pastQuestionsTotalCount: 1,
  aocCount: DEMO_AOC_ANSWERS.length,
  quizAttemptsCount: DEMO_QUIZ_ATTEMPTS.length,
  quizAverage: 81,
  flashcardsMastered: 1,
  flashcardsTotal: DEMO_FLASHCARDS.length,
  readinessScore: DEMO_READINESS_SCORE,
};
