import type { AnswerMode, EducationLevel, SubjectType } from "@/types";

function buildEducationGuidance(educationLevel: EducationLevel | null | undefined) {
  if (educationLevel === "primary") {
    return {
      label: "Primary",
      profile:
        "Use very simple language, keep explanations short, and make the story safe, vivid, and easy to follow.",
      assessment: "Use short, concrete questions with clear scaffolding and gentle encouragement.",
    };
  }

  if (educationLevel === "secondary") {
    return {
      label: "Secondary",
      profile:
        "Use clear language, moderate detail, and practical examples that feel familiar to a school student.",
      assessment: "Use direct, exam-focused prompts with enough detail for school-level revision.",
    };
  }

  return {
    label: "Tertiary",
    profile:
      "Use formal academic language, fuller analysis, and complete exam-ready structure for university-level study.",
    assessment: "Use university-level prompts with deeper reasoning and strong examiner expectations.",
  };
}

export const WIKI_SYSTEM_PROMPT = [
  "You are StudyMate's WikiAgent.",
  "You convert course materials into a structured study wiki that other agents can query.",
  "Return ONLY a valid JSON array of wiki page objects.",
  "Do not include markdown fences, commentary, explanations, or extra keys outside the schema.",
  "Each object must have: title, type, content, related_pages, source_material.",
  "Use markdown in content, but keep it clean, structured, and concise enough for study use.",
  "Do not duplicate pages that cover the same concept.",
  "Prefer high-signal, exam-relevant pages over broad summaries.",
  "If the source text is noisy, infer the most useful study pages from the strongest signals only.",
  "Allowed page types: principle, case, formula, maxim, definition, concept.",
].join("\n");

export function buildWikiPrompt({
  courseName,
  subjectType,
  materials,
}: {
  courseName: string;
  subjectType: SubjectType;
  materials: Array<{
    fileName: string;
    text: string;
  }>;
}) {
  const materialBlocks = materials
    .map((material, index) => {
      const cappedText = material.text.trim().slice(0, 12000);

      return [
        `MATERIAL ${index + 1}`,
        `FILE_NAME: ${material.fileName}`,
        `SOURCE_MATERIAL: ${material.fileName}`,
        "OCR_TEXT:",
        cappedText,
        "END_MATERIAL",
      ].join("\n");
    })
    .join("\n\n");

  return [
    `Course name: ${courseName}`,
    `Subject type: ${subjectType}`,
    "",
    "Task:",
    "Read all course materials and build a set of structured wiki pages.",
    "Each wiki page should represent one concept, rule, case, formula, maxim, definition, or principle that students should be able to revise later.",
    "",
    "Subject-specific guidance:",
    "- Law: extract each legal principle as its own page, each case as its own page with facts, held, ratio, and significance, and each Latin maxim as its own page.",
    "- Engineering: extract each formula as its own page with symbol definitions, units, rearrangements if useful, and when to apply it.",
    "- Medicine: extract each major drug, disease, or condition as its own page with definition, symptoms, mechanism, diagnosis, treatment, and key warnings if present.",
    "- Economics: extract core theories, models, definitions, and formulas as separate pages.",
    "- Other subjects: extract the most important study concepts as separate pages.",
    "",
    "For every page object:",
    "- title: concise study-friendly title",
    "- type: one of principle, case, formula, maxim, definition, concept",
    "- content: markdown with clear headings and bullet points where helpful",
    "- related_pages: array of related page titles that should be linked",
    "- source_material: the exact file name the page mainly came from",
    "",
    "Return a JSON array like:",
    `[{"title":"Negligence","type":"principle","content":"## Definition\\n...","related_pages":["Donoghue v Stevenson"],"source_material":"Law of Torts.pdf"}]`,
    "",
    "Materials:",
    materialBlocks || "No materials provided.",
  ].join("\n");
}

export const PROFILING_SYSTEM_PROMPT = [
  "You are StudyMate's ProfilingAgent.",
  "Classify the course subject type from a sample of study materials.",
  "Return ONLY valid JSON with the keys subject_type, confidence, and reasoning.",
  "Do not include markdown fences, commentary, or extra keys.",
  "subject_type must be one of: law, engineering, medicine, economics, other.",
  "confidence must be a number from 0 to 1.",
].join("\n");

export function buildProfilingPrompt({
  courseName,
  sampleText,
}: {
  courseName: string;
  sampleText: string;
}) {
  return [
    `Course name: ${courseName}`,
    "Task:",
    "Read the sample of material and classify the course subject type.",
    "Return raw JSON only in this shape:",
    '{ "subject_type": "law", "confidence": 0.95, "reasoning": "Contains legal cases and statutes" }',
    "",
    "Sample:",
    sampleText,
  ].join("\n");
}

export const NOTES_SYSTEM_PROMPT = [
  "You are StudyMate's NotesAgent.",
  "Write clean, structured, exam-focused study notes from the wiki pages provided.",
  "Return ONLY markdown content.",
  "Do not wrap the answer in JSON or markdown fences.",
  "Make the notes concise, useful, and revision-friendly.",
  "Use the subject-specific structure requested by the user.",
  "If subject_type is law, use IRAC in exam answer guidance and point out at least two issues when analyzing problem questions.",
].join("\n");

export function buildNotesPrompt({
  courseName,
  subjectType,
  wikiPages,
}: {
  courseName: string;
  subjectType: SubjectType;
  wikiPages: Array<{
    title: string;
    type: string;
    content: string;
    source_material?: string | null;
  }>;
}) {
  const typeOrder = ["principle", "case", "formula", "maxim", "definition", "concept"] as const;
  const groupedPages = typeOrder
    .map((type) => {
      const pagesForType = wikiPages.filter((page) => page.type === type);
      if (pagesForType.length === 0) {
        return "";
      }

      return [
        `## ${type.toUpperCase()}S`,
        ...pagesForType.map((page, index) => {
          const cappedText = page.content.trim().slice(0, 8000);
          return [
            `PAGE ${index + 1}`,
            `TITLE: ${page.title}`,
            `TYPE: ${page.type}`,
            `SOURCE_MATERIAL: ${page.source_material ?? "Unknown"}`,
            "CONTENT:",
            cappedText,
            "END_PAGE",
          ].join("\n");
        }),
      ].join("\n\n");
    })
    .filter(Boolean)
    .join("\n\n");

  return [
    `Course name: ${courseName}`,
    `Subject type: ${subjectType}`,
    "",
    "Task:",
    "Read all wiki pages and write a comprehensive set of study notes in markdown.",
    "Use the structure requested for the subject type.",
    "",
    "Subject-specific structure:",
    "For LAW:",
    "## [Topic Name]",
    "### Definition",
    "### Key Principles",
    "### Relevant Cases",
    "- **Case name**: Facts → Held → Significance",
    "### Latin Maxims",
    "### Exam Tips",
    "All exam answers must follow IRAC format, and they must identify at least two issues with problem cases when brought to them.",
    "",
    "For ENGINEERING:",
    "## [Topic Name]",
    "### Core Concept",
    "### Key Formulas",
    "- Formula: symbol definitions, units",
    "### When to Apply",
    "### Worked Example approach",
    "### Exam Tips",
    "",
    "For MEDICINE:",
    "## [Topic Name]",
    "### Overview",
    "### Key Facts",
    "### Clinical Points",
    "### Mnemonics",
    "### Exam Tips",
    "",
    "For ECONOMICS / OTHER:",
    "## [Topic Name]",
    "### Definition",
    "### Key Points",
    "### Important Details",
    "### Exam Tips",
    "",
    "Use the wiki pages as the source of truth and synthesize them into readable revision notes.",
    "Return only markdown content.",
    "",
    "Wiki pages:",
  groupedPages,
  ].join("\n");
}

export const GUARDRAILS_SYSTEM_PROMPT = [
  "You are StudyMate's GuardrailsAgent.",
  "Check whether an answer is supported by the provided wiki pages.",
  "Return ONLY valid JSON with the keys confidence, verified, citations_found, issues, and warning_message.",
  "Do not include markdown fences, commentary, or extra keys.",
  'confidence must be one of "high", "medium", or "low".',
  "verified must be a boolean.",
  "citations_found must be a boolean.",
  "issues must be an array of short strings.",
  "warning_message must be null or a short user-facing string.",
].join("\n");

export function buildGuardrailsPrompt({
  courseName,
  questionType,
  answer,
  wikiPages,
}: {
  courseName: string;
  questionType: string;
  answer: string;
  wikiPages: Array<{
    title: string;
    type: string;
    content: string;
    source_material?: string | null;
  }>;
}) {
  const pagesText = wikiPages
    .map((page, index) => {
      const cappedText = page.content.trim().slice(0, 5000);
      return [
        `WIKI PAGE ${index + 1}`,
        `TITLE: ${page.title}`,
        `TYPE: ${page.type}`,
        `SOURCE_MATERIAL: ${page.source_material ?? "Unknown"}`,
        "CONTENT:",
        cappedText,
        "END_WIKI_PAGE",
      ].join("\n");
    })
    .join("\n\n");

  return [
    `Course name: ${courseName}`,
    `Question type: ${questionType}`,
    "",
    "Task:",
    "Compare the answer against the provided wiki pages.",
    "Check whether the cited cases, principles, formulas, and facts actually exist in the materials.",
    "Check whether the answer appears grounded in the provided study materials.",
    "If the answer looks well supported, use high confidence.",
    "If the answer is partly supported or needs caution, use medium confidence.",
    "If the answer is weakly supported, inaccurate, or cites unsupported claims, use low confidence.",
    "",
    "Answer to verify:",
    answer,
    "",
    "Wiki pages:",
    pagesText || "No wiki pages provided.",
  ].join("\n");
}

export const PAST_QUESTION_SYSTEM_PROMPT = [
  "You are StudyMate's PastQuestionAgent.",
  "Answer exam questions using only the Microsoft Foundry IQ retrieved knowledge context.",
  "Return ONLY markdown content.",
  "Do not include JSON or markdown fences.",
  "Be exam-focused, concise, and grounded in the source materials.",
  "Always cite specific retrieved source page titles in the answer where relevant.",
].join("\n");

export function buildPastQuestionPrompt({
  courseName,
  subjectType,
  question,
  wikiPages,
  strict = false,
  mode = "plain",
  educationLevel,
}: {
  courseName: string;
  subjectType: SubjectType;
  question: string;
  mode?: AnswerMode;
  educationLevel?: EducationLevel;
  wikiPages: Array<{
    title: string;
    type: string;
    content: string;
    source_material?: string | null;
  }>;
  strict?: boolean;
}) {
  const learningGuidance = buildEducationGuidance(educationLevel);
  const groupedPages = wikiPages
    .map((page, index) => {
      const cappedText = page.content.trim().slice(0, 7000);
      return [
        `WIKI PAGE ${index + 1}`,
        `TITLE: ${page.title}`,
        `TYPE: ${page.type}`,
        `SOURCE_MATERIAL: ${page.source_material ?? "Unknown"}`,
        "CONTENT:",
        cappedText,
        "END_WIKI_PAGE",
      ].join("\n");
    })
    .join("\n\n");

  return [
    `Course name: ${courseName}`,
    `Subject type: ${subjectType}`,
    `Education level: ${learningGuidance.label}`,
    `Answer mode: ${mode}`,
    strict ? "Use an even stricter grounding pass. Do not add unsupported claims." : "",
    "",
    "Question:",
    question,
    "",
    "Task:",
    "Answer the question using only the retrieved knowledge context below.",
    learningGuidance.profile,
    "Structure the answer for maximum exam marks.",
    mode === "story"
      ? "Use a grounded story-led flow that feels like a client or real-world scenario, then move into the exam answer. Keep the story tightly anchored to the wiki pages."
      : "Use a direct exam-answer structure.",
    "",
    "For LAW questions:",
    mode === "story"
      ? [
          "**Scene Setup**",
          "A short client or courtroom story that frames the question.",
          "",
          "**Issue Spotting**",
          "Identify at least two issues where possible.",
          "",
          "**Legal Framework**",
          "Relevant principles and statutes",
          "",
          "**Case Authorities**",
          "- Case name: relevant facts and held",
          "- How it applies to the question",
          "",
          "**Application / Court Scene**",
          "Apply the law to the facts in story form but stay precise.",
          "",
          "**Advice / Victory**",
          "Explain the result or advice in a strong final takeaway.",
        ].join("\n")
      : [
          "**Introduction**",
          "Brief statement of the legal issue",
          "",
          "**Legal Framework**",
          "Relevant principles and statutes",
          "",
          "**Case Authorities**",
          "- Case name: relevant facts and held",
          "- How it applies to the question",
          "",
          "**Analysis**",
          "Application of law to the question",
          "",
          "**Conclusion**",
          "Clear definitive answer",
        ].join("\n"),
    "",
    "For ENGINEERING questions:",
    mode === "story"
      ? [
          "**Scene Setup**",
          "A practical engineering problem or system fault that introduces the issue.",
          "",
          "**Relevant Formulas**",
          "List formulas with symbol definitions",
          "",
          "**Solution Approach**",
          "Step by step methodology",
          "",
          "**Key Considerations**",
          "Common mistakes to avoid",
          "",
          "**Conclusion**",
        ].join("\n")
      : [
          "**Introduction**",
          "State what is being solved",
          "",
          "**Relevant Formulas**",
          "List formulas with symbol definitions",
          "",
          "**Solution Approach**",
          "Step by step methodology",
          "",
          "**Key Considerations**",
          "Common mistakes to avoid",
          "",
          "**Conclusion**",
        ].join("\n"),
    "",
    "For OTHER subjects:",
    mode === "story"
      ? "Use a grounded story or scenario first, then move into Introduction -> Main Body -> Conclusion with relevant citations from materials."
      : "Use Introduction -> Main Body -> Conclusion with relevant citations from materials.",
    "",
    "Rules:",
    "- Always cite specific retrieved source page titles in the body where relevant.",
    "- If unsure about something, say so explicitly.",
    "- Stay grounded in the provided Foundry IQ retrieval context only.",
    "- If strict mode is enabled, prioritize caution over speculation.",
    "",
    "Retrieved knowledge context:",
    groupedPages || "No wiki pages provided.",
  ].join("\n");
}

export const AOC_SYSTEM_PROMPT = [
  "You are StudyMate's AOCAgent.",
  "Answer one topic at a time using only the Microsoft Foundry IQ retrieved knowledge context.",
  "Return ONLY markdown content.",
  "Do not include JSON or markdown fences.",
  "Be concise but comprehensive, and exam focused.",
  "Cite specific retrieved source page titles where relevant.",
].join("\n");

export function buildAocPrompt({
  courseName,
  subjectType,
  topic,
  wikiPages,
  mode = "plain",
  educationLevel,
}: {
  courseName: string;
  subjectType: SubjectType;
  topic: string;
  mode?: AnswerMode;
  educationLevel?: EducationLevel;
  wikiPages: Array<{
    title: string;
    type: string;
    content: string;
    source_material?: string | null;
  }>;
}) {
  const learningGuidance = buildEducationGuidance(educationLevel);
  const pagesText = wikiPages
    .map((page, index) => {
      const cappedText = page.content.trim().slice(0, 7000);
      return [
        `WIKI PAGE ${index + 1}`,
        `TITLE: ${page.title}`,
        `TYPE: ${page.type}`,
        `SOURCE_MATERIAL: ${page.source_material ?? "Unknown"}`,
        "CONTENT:",
        cappedText,
        "END_WIKI_PAGE",
      ].join("\n");
    })
    .join("\n\n");

  return [
    `Course name: ${courseName}`,
    `Subject type: ${subjectType}`,
    `Education level: ${learningGuidance.label}`,
    `Answer mode: ${mode}`,
    "",
    `Topic: ${topic}`,
    "",
    "Task:",
    "Read the topic and use the retrieved Foundry IQ context for the most relevant material.",
    learningGuidance.profile,
    "Write a structured exam-ready answer for this one topic only.",
    mode === "story"
      ? "Use a grounded story-driven teaching scene that feels like a mentor walking the student through the topic, but keep the answer exam-ready and anchored to the wiki pages."
      : "Use a plain, direct exam answer structure.",
    "",
    mode === "story"
      ? [
          "Format:",
          "## [Topic Name]",
          "",
          "**Scene Setup**",
          "A short story or vignette that introduces the topic in a memorable way.",
          "",
          "**Core Rule**",
          "The main legal/scientific/economic rule from the materials.",
          "",
          "**What the student should notice**",
          "The key facts, warning signs, or triggers that matter in the exam.",
          "",
          "**Support from the wiki**",
          "- Case name / Statute / Formula from the materials",
          "- Brief explanation of relevance",
          "",
          "**Exam application**",
          "How to turn the story into a full exam answer.",
          "",
          "**Victory moment**",
          "A short concluding line showing the correct resolution or takeaway.",
        ].join("\n")
      : [
          "Format:",
          "## [Topic Name]",
          "",
          "**Definition**",
          "Clear concise definition",
          "",
          "**Key Principle / Rule**",
          "The core legal/scientific/economic principle",
          "",
          "**Supporting Authority**",
          "- Case name / Statute / Formula from materials",
          "- Brief explanation of relevance",
          "",
          "**Exam Application Tip**",
          "How examiners typically test this topic",
          "Common mistakes students make",
        ].join("\n"),
    "",
    "Rules:",
    "- Return only the markdown answer for this one topic.",
    "- Keep it concise but comprehensive.",
    "- Use only the retrieved knowledge context below as your source of truth.",
    "",
    "Retrieved knowledge context:",
    pagesText || "No wiki pages provided.",
  ].join("\n");
}

export const KEY_POINTS_SYSTEM_PROMPT = [
  "You are StudyMate's KeyPointsAgent.",
  "Extract high-value exam-focused key points from wiki pages.",
  "Return ONLY a valid JSON array of key point objects.",
  "Do not include markdown fences, commentary, or extra keys.",
  "Each object must have: type, title, content, source_material.",
  "Use concise titles and markdown content that captures the exam-essential substance.",
  "Allowed types: principle, case, formula, maxim, definition, concept.",
].join("\n");

export function buildKeyPointsPrompt({
  courseName,
  subjectType,
  wikiPages,
  educationLevel,
}: {
  courseName: string;
  subjectType: SubjectType;
  educationLevel?: EducationLevel;
  wikiPages: Array<{
    title: string;
    type: string;
    content: string;
    source_material?: string | null;
  }>;
}) {
  const learningGuidance = buildEducationGuidance(educationLevel);
  const pagesText = wikiPages
    .map((page, index) => {
      const cappedText = page.content.trim().slice(0, 7000);
      return [
        `WIKI PAGE ${index + 1}`,
        `TITLE: ${page.title}`,
        `TYPE: ${page.type}`,
        `SOURCE_MATERIAL: ${page.source_material ?? "Unknown"}`,
        "CONTENT:",
        cappedText,
        "END_WIKI_PAGE",
      ].join("\n");
    })
    .join("\n\n");

  return [
    `Course name: ${courseName}`,
    `Subject type: ${subjectType}`,
    `Education level: ${learningGuidance.label}`,
    "",
    "Task:",
    "Read the wiki pages and extract the best key points for study revision.",
    learningGuidance.profile,
    "",
    "Extraction rules:",
    "For LAW:",
    "- Each legal principle as a key point (type: principle) with title = principle name and content = full statement + application.",
    "- Each case as a key point (type: case) with title = case name and content = Facts | Held | Ratio | Significance.",
    "- Each Latin maxim as a key point (type: maxim) with title = Latin phrase and content = translation + meaning + when used.",
    "",
    "For ENGINEERING:",
    "- Each formula as a key point (type: formula) with title = formula name and content = formula + symbol definitions + units + conditions for application.",
    "- Each concept as a key point (type: concept) with title = concept name and content = explanation + application.",
    "",
    "For MEDICINE:",
    "- Each drug or condition as a key point (type: definition) with title = drug or condition name and content = mechanism + dosage + key facts + mnemonics.",
    "",
    "For ECONOMICS / OTHER:",
    "- Each key term as a key point (type: definition) with title = term and content = definition + importance + exam relevance.",
    "",
    "Return ONLY a valid JSON array like:",
    `[{"type":"case","title":"Donoghue v Stevenson","content":"**Facts**: ...\\n**Held**: ...\\n**Ratio**: ...","source_material":"Law of Torts.pdf"}]`,
    "",
    "Wiki pages:",
    pagesText || "No wiki pages provided.",
  ].join("\n");
}

export const FLASHCARD_SYSTEM_PROMPT = [
  "You are StudyMate's FlashcardAgent.",
  "Turn key points into compact exam flashcards.",
  "Return ONLY valid JSON array of flashcard objects.",
  "Do not include markdown fences, commentary, or extra keys.",
  "Each object must have key_point_id, front, back.",
  "The back should be condensed to exam essentials and concise enough for fast revision.",
].join("\n");

export function buildFlashcardPrompt({
  courseName,
  keyPoints,
}: {
  courseName: string;
  keyPoints: Array<{
    id: string;
    title: string;
    type: string;
    content: string;
    source_material?: string | null;
  }>;
}) {
  const pointsText = keyPoints
    .map((point, index) => {
      const cappedText = point.content.trim().slice(0, 5000);
      return [
        `KEY POINT ${index + 1}`,
        `ID: ${point.id}`,
        `TITLE: ${point.title}`,
        `TYPE: ${point.type}`,
        `SOURCE_MATERIAL: ${point.source_material ?? "Unknown"}`,
        "CONTENT:",
        cappedText,
        "END_KEY_POINT",
      ].join("\n");
    })
    .join("\n\n");

  return [
    `Course name: ${courseName}`,
    "",
    "Task:",
    "Convert the key points into flashcards for fast exam revision.",
    "Keep the front as the title, and the back as condensed exam essentials.",
    "Focus on clarity, brevity, and recall-friendly wording.",
    "",
    "Return a JSON array like:",
    `[{"key_point_id":"uuid","front":"Donoghue v Stevenson","back":"A negligence case establishing the neighbour principle..."}]`,
    "",
    "Key points:",
    pointsText,
  ].join("\n");
}

export const QUIZ_GENERATION_SYSTEM_PROMPT = [
  "You are StudyMate's QuizAgent.",
  "Generate exam-quality questions from the provided wiki pages.",
  "Return ONLY a valid JSON array of question objects.",
  "Do not include markdown fences, commentary, or extra keys.",
  "For MCQ questions, every object must include: type, question, options, correct_answer, explanation, topic, source_material.",
  "For essay questions, every object must include: type, question, model_answer, key_points, marks, topic, source_material.",
  "Use realistic exam wording and plausible distractors.",
  "Mix difficulty as instructed: 30% easy, 50% medium, 20% hard.",
].join("\n");

export function buildQuizGenerationPrompt({
  courseName,
  subjectType,
  quizType,
  questionCount,
  wikiPages,
  educationLevel,
}: {
  courseName: string;
  subjectType: SubjectType;
  quizType: "mcq" | "essay" | "mixed";
  questionCount: number;
  educationLevel?: EducationLevel;
  wikiPages: Array<{
    title: string;
    type: string;
    content: string;
    source_material?: string | null;
  }>;
}) {
  const learningGuidance = buildEducationGuidance(educationLevel);
  const pagesText = wikiPages
    .map((page, index) => {
      const cappedText = page.content.trim().slice(0, 7000);
      return [
        `WIKI PAGE ${index + 1}`,
        `TITLE: ${page.title}`,
        `TYPE: ${page.type}`,
        `SOURCE_MATERIAL: ${page.source_material ?? "Unknown"}`,
        "CONTENT:",
        cappedText,
        "END_WIKI_PAGE",
      ].join("\n");
    })
    .join("\n\n");

  return [
    `Course name: ${courseName}`,
    `Subject type: ${subjectType}`,
    `Education level: ${learningGuidance.label}`,
    `Quiz type: ${quizType}`,
    `Question count: ${questionCount}`,
    "",
    "Task:",
    "Read all wiki pages and generate exam-standard quiz questions that could appear in a real exam.",
    learningGuidance.assessment,
    "",
    "For MCQ:",
    "- Make all 4 options plausible.",
    "- No obvious wrong answers.",
    "- Base questions on cases, principles, formulas, and facts from the wiki.",
    "- Include an explanation for why the correct answer is right and why the others are wrong.",
    "",
    "For Essay:",
    "- Generate questions at exam standard difficulty.",
    "- Include a model answer structure with key points.",
    "- Assign a realistic mark allocation.",
    "",
    "Return JSON objects with this shape:",
    '{"type":"mcq","question":"...","options":[{"label":"A","text":"...","correct":false},{"label":"B","text":"...","correct":true},{"label":"C","text":"...","correct":false},{"label":"D","text":"...","correct":false}],"correct_answer":"B","explanation":"...","topic":"Negligence","source_material":"Law of Torts.pdf"}',
    '{"type":"essay","question":"...","model_answer":"...","key_points":["..."],"marks":20,"topic":"Negligence","source_material":"Law of Torts.pdf"}',
    "",
    "Rules:",
    "- Return only a valid JSON array.",
    "- Do not include markdown backticks or any preamble.",
    "- Ensure the total number of questions matches the requested count.",
    "- If quiz type is mixed, include both MCQ and essay questions.",
    "",
    "Wiki pages:",
    pagesText || "No wiki pages provided.",
  ].join("\n");
}

export const QUIZ_GRADING_SYSTEM_PROMPT = [
  "You are StudyMate's QuizGrader.",
  "Grade essay answers fairly as an experienced examiner would.",
  "Return ONLY valid JSON with the keys score, max_score, percentage, grade, feedback, strengths, improvements, key_points_covered, key_points_missed.",
  "Do not include markdown fences, commentary, or extra keys.",
  "Grade letters must be one of A, B, C, D, or F.",
].join("\n");

export function buildQuizGradingPrompt({
  courseName,
  subjectType,
  question,
  modelAnswer,
  studentAnswer,
  keyPoints,
  marks,
  wikiPages,
  educationLevel,
}: {
  courseName: string;
  subjectType: SubjectType;
  question: string;
  modelAnswer?: string;
  studentAnswer: string;
  keyPoints?: string[];
  marks?: number;
  educationLevel?: EducationLevel;
  wikiPages: Array<{
    title: string;
    type: string;
    content: string;
    source_material?: string | null;
  }>;
}) {
  const learningGuidance = buildEducationGuidance(educationLevel);
  const pagesText = wikiPages
    .map((page, index) => {
      const cappedText = page.content.trim().slice(0, 5000);
      return [
        `WIKI PAGE ${index + 1}`,
        `TITLE: ${page.title}`,
        `TYPE: ${page.type}`,
        `SOURCE_MATERIAL: ${page.source_material ?? "Unknown"}`,
        "CONTENT:",
        cappedText,
        "END_WIKI_PAGE",
      ].join("\n");
    })
    .join("\n\n");

  return [
    `Course name: ${courseName}`,
    `Subject type: ${subjectType}`,
    `Education level: ${learningGuidance.label}`,
    `Marks available: ${marks ?? 20}`,
    "",
    "Task:",
    "Read the question, model answer, wiki pages, and student answer.",
    learningGuidance.assessment,
    "Grade the answer fairly and return the JSON object requested.",
    "",
    "Question:",
    question,
    "",
    "Model answer:",
    modelAnswer ?? "No model answer provided.",
    "",
    "Key points:",
    (keyPoints ?? []).length > 0 ? (keyPoints ?? []).join(", ") : "No key points provided.",
    "",
    "Student answer:",
    studentAnswer,
    "",
    "Wiki pages:",
    pagesText || "No wiki pages provided.",
    "",
    "Rules:",
    "- Award marks for each key point covered.",
    "- Provide specific constructive feedback.",
    "- Identify exact strengths and gaps.",
    "- Assign a letter grade: A, B, C, D, or F.",
    "- Return raw JSON only.",
  ].join("\n");
}
