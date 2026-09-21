import type { SubjectType } from "@/types";
import { calculateReadinessBreakdown, type ReadinessBreakdown } from "@/lib/readiness";

export type StudyActionTone = "violet" | "emerald" | "amber" | "rose" | "cyan" | "slate";
export type StudyActionIcon =
  | "upload"
  | "wiki"
  | "learn"
  | "flashcards"
  | "practice"
  | "quiz"
  | "pdf"
  | "source"
  | "weak";

export type CourseCoachMetrics = {
  materialsTotal: number;
  materialsReady: number;
  materialsFailed: number;
  notesCount: number;
  wikiPagesCount: number;
  keyPointsCount: number;
  flashcardsTotal: number;
  flashcardsMastered: number;
  pastQuestionsTotal: number;
  pastQuestionsAnswered: number;
  quizAttemptsCount: number;
  quizAveragePercent: number;
  lowConfidenceAnswers: number;
};

export type CourseCoachSummary = {
  id: string;
  name: string;
  subjectType: SubjectType | string;
  description?: string | null;
  createdAt?: string;
  readinessScore?: number | null;
  metrics: CourseCoachMetrics;
};

export type StudyAction = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  priority: "high" | "medium" | "low";
  tone: StudyActionTone;
  icon: StudyActionIcon;
  courseId?: string;
  courseName?: string;
};

export type CourseProgressStep = {
  id: "upload" | "learn" | "practice" | "pdf";
  label: string;
  detail: string;
  href: string;
  status: "done" | "current" | "locked";
  icon: StudyActionIcon;
};

export type WeakArea = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  tone: StudyActionTone;
};

export function emptyCoachMetrics(): CourseCoachMetrics {
  return {
    materialsTotal: 0,
    materialsReady: 0,
    materialsFailed: 0,
    notesCount: 0,
    wikiPagesCount: 0,
    keyPointsCount: 0,
    flashcardsTotal: 0,
    flashcardsMastered: 0,
    pastQuestionsTotal: 0,
    pastQuestionsAnswered: 0,
    quizAttemptsCount: 0,
    quizAveragePercent: 0,
    lowConfidenceAnswers: 0,
  };
}

export function getCourseReadiness(course: CourseCoachSummary): ReadinessBreakdown {
  return calculateReadinessBreakdown({
    quizAveragePercent: course.metrics.quizAveragePercent,
    pastQuestionsAnsweredCount: course.metrics.pastQuestionsAnswered,
    pastQuestionsTotalCount: course.metrics.pastQuestionsTotal,
    flashcardsMasteredCount: course.metrics.flashcardsMastered,
    flashcardsTotalCount: course.metrics.flashcardsTotal,
    wikiPagesCount: course.metrics.wikiPagesCount,
  });
}

export function getCourseProgressSteps(course: CourseCoachSummary): CourseProgressStep[] {
  const { metrics } = course;
  const hasMaterials = metrics.materialsTotal > 0;
  const hasLearningBase = metrics.wikiPagesCount > 0 || metrics.notesCount > 0;
  const hasPractice = metrics.pastQuestionsAnswered > 0 || metrics.quizAttemptsCount > 0;
  const readyForPdf = hasMaterials && hasLearningBase && hasPractice;

  const states: CourseProgressStep["status"][] = [
    hasMaterials ? "done" : "current",
    !hasMaterials ? "locked" : hasLearningBase ? "done" : "current",
    !hasLearningBase ? "locked" : hasPractice ? "done" : "current",
    !readyForPdf ? "locked" : "current",
  ];

  return [
    {
      id: "upload",
      label: "Upload",
      detail: hasMaterials ? `${metrics.materialsReady}/${metrics.materialsTotal} ready` : "Add notes, PDFs, scans, or links",
      href: `/courses/${course.id}/materials`,
      status: states[0],
      icon: "upload",
    },
    {
      id: "learn",
      label: "Learn",
      detail: hasLearningBase ? `${metrics.wikiPagesCount} wiki pages, ${metrics.keyPointsCount} key points` : "Build wiki and learn the topic",
      href: `/courses/${course.id}/learn`,
      status: states[1],
      icon: "learn",
    },
    {
      id: "practice",
      label: "Practice",
      detail: hasPractice ? `${metrics.pastQuestionsAnswered} answers, ${metrics.quizAttemptsCount} quizzes` : "Test yourself with exam practice",
      href: `/courses/${course.id}/exam-prep`,
      status: states[2],
      icon: "practice",
    },
    {
      id: "pdf",
      label: "Revision PDF",
      detail: readyForPdf ? "Package the full study record" : "Unlock after practice",
      href: `/courses/${course.id}/report`,
      status: states[3],
      icon: "pdf",
    },
  ];
}

export function getWeakAreas(course: CourseCoachSummary): WeakArea[] {
  const { metrics } = course;
  const weakAreas: WeakArea[] = [];

  if (metrics.materialsFailed > 0) {
    weakAreas.push({
      id: `${course.id}-failed-materials`,
      title: "Source processing needs attention",
      body: `${metrics.materialsFailed} uploaded material${metrics.materialsFailed === 1 ? "" : "s"} failed OCR or indexing.`,
      href: `/courses/${course.id}/materials`,
      cta: "Review uploads",
      tone: "rose",
    });
  }

  if (metrics.materialsReady > 0 && metrics.wikiPagesCount === 0) {
    weakAreas.push({
      id: `${course.id}-missing-wiki`,
      title: "Knowledge base is not built",
      body: "The course has readable material, but no wiki pages to ground answers yet.",
      href: `/courses/${course.id}/materials`,
      cta: "Build wiki",
      tone: "amber",
    });
  }

  if (metrics.flashcardsTotal > 0 && metrics.flashcardsMastered < metrics.flashcardsTotal) {
    weakAreas.push({
      id: `${course.id}-flashcards-review`,
      title: "Flashcards need review",
      body: `${metrics.flashcardsTotal - metrics.flashcardsMastered} flashcard${metrics.flashcardsTotal - metrics.flashcardsMastered === 1 ? "" : "s"} still need mastery.`,
      href: `/courses/${course.id}/flashcards`,
      cta: "Review flashcards",
      tone: "cyan",
    });
  }

  if (metrics.quizAttemptsCount > 0 && metrics.quizAveragePercent < 70) {
    weakAreas.push({
      id: `${course.id}-quiz-score`,
      title: "Quiz score is below target",
      body: `Average quiz performance is ${Math.round(metrics.quizAveragePercent)}%. Review missed topics before the next attempt.`,
      href: `/courses/${course.id}/quiz`,
      cta: "Retake quiz",
      tone: "amber",
    });
  }

  if (metrics.pastQuestionsAnswered === 0 && metrics.wikiPagesCount > 0) {
    weakAreas.push({
      id: `${course.id}-practice-gap`,
      title: "No exam answers practiced yet",
      body: "You have study material, but no saved past-question attempt for this course.",
      href: `/courses/${course.id}/past-questions`,
      cta: "Practice now",
      tone: "violet",
    });
  }

  if (metrics.lowConfidenceAnswers > 0) {
    weakAreas.push({
      id: `${course.id}-low-confidence`,
      title: "Some answers need stronger evidence",
      body: `${metrics.lowConfidenceAnswers} saved answer${metrics.lowConfidenceAnswers === 1 ? "" : "s"} were marked low confidence.`,
      href: `/courses/${course.id}/past-questions`,
      cta: "Strengthen answers",
      tone: "rose",
    });
  }

  return weakAreas.slice(0, 4);
}

export function getStudyActions(course: CourseCoachSummary): StudyAction[] {
  const { metrics } = course;
  const actions: StudyAction[] = [];

  const push = (action: Omit<StudyAction, "courseId" | "courseName">) => {
    actions.push({ ...action, courseId: course.id, courseName: course.name });
  };

  if (metrics.materialsTotal === 0) {
    push({
      id: `${course.id}-upload`,
      title: "Start by uploading course material",
      body: "StudyMate needs notes, PDFs, scans, or article links before it can generate grounded learning.",
      href: `/courses/${course.id}/materials`,
      cta: "Upload material",
      priority: "high",
      tone: "violet",
      icon: "upload",
    });
  }

  if (metrics.materialsFailed > 0) {
    push({
      id: `${course.id}-fix-sources`,
      title: "Fix failed source processing",
      body: "Some files failed OCR or indexing, so later answers may miss important material.",
      href: `/courses/${course.id}/materials`,
      cta: "Review files",
      priority: "high",
      tone: "rose",
      icon: "source",
    });
  }

  if (metrics.materialsReady > 0 && metrics.wikiPagesCount === 0) {
    push({
      id: `${course.id}-build-wiki`,
      title: "Build the course wiki",
      body: "Turn readable materials into structured source pages for Learn, Quiz, and Exam Prep.",
      href: `/courses/${course.id}/materials`,
      cta: "Build wiki",
      priority: "high",
      tone: "amber",
      icon: "wiki",
    });
  }

  if (metrics.wikiPagesCount > 0 && metrics.keyPointsCount === 0) {
    push({
      id: `${course.id}-key-points`,
      title: "Extract high-value key points",
      body: "Pull out the cases, formulas, definitions, and principles that should become flashcards.",
      href: `/courses/${course.id}/key-points`,
      cta: "Extract key points",
      priority: "medium",
      tone: "cyan",
      icon: "learn",
    });
  }

  if (metrics.keyPointsCount > 0 && metrics.flashcardsTotal === 0) {
    push({
      id: `${course.id}-flashcards`,
      title: "Generate flashcards from weak areas",
      body: "Convert key points into active recall so revision stops being passive reading.",
      href: `/courses/${course.id}/flashcards`,
      cta: "Generate flashcards",
      priority: "medium",
      tone: "cyan",
      icon: "flashcards",
    });
  }

  if (metrics.flashcardsTotal > 0 && metrics.flashcardsMastered < metrics.flashcardsTotal) {
    push({
      id: `${course.id}-review-flashcards`,
      title: "Review unmastered flashcards",
      body: `${metrics.flashcardsTotal - metrics.flashcardsMastered} cards are still in review.`,
      href: `/courses/${course.id}/flashcards`,
      cta: "Review cards",
      priority: "medium",
      tone: "cyan",
      icon: "flashcards",
    });
  }

  if (metrics.wikiPagesCount > 0 && metrics.pastQuestionsAnswered === 0) {
    push({
      id: `${course.id}-past-question`,
      title: "Practice one exam-style answer",
      body: "Move from understanding to performance with a past-question or scenario attempt.",
      href: `/courses/${course.id}/past-questions`,
      cta: "Practice answer",
      priority: "high",
      tone: "violet",
      icon: "practice",
    });
  }

  if (metrics.wikiPagesCount > 0 && metrics.quizAttemptsCount === 0) {
    push({
      id: `${course.id}-quiz`,
      title: "Take a readiness quiz",
      body: "Use a quick quiz to expose what you remember and what still needs work.",
      href: `/courses/${course.id}/quiz`,
      cta: "Start quiz",
      priority: "medium",
      tone: "emerald",
      icon: "quiz",
    });
  }

  const readiness = getCourseReadiness(course).overall;
  if (readiness >= 65 && metrics.pastQuestionsAnswered > 0) {
    push({
      id: `${course.id}-pdf`,
      title: "Package a revision PDF",
      body: "You have enough learning and practice data to generate a useful revision pack.",
      href: `/courses/${course.id}/report`,
      cta: "Preview PDF",
      priority: "low",
      tone: "emerald",
      icon: "pdf",
    });
  }

  return actions.sort((a, b) => {
    const weight = { high: 3, medium: 2, low: 1 };
    return weight[b.priority] - weight[a.priority];
  });
}

export function getBestStudyAction(courses: CourseCoachSummary[]): StudyAction | null {
  return courses.flatMap(getStudyActions)[0] ?? null;
}
