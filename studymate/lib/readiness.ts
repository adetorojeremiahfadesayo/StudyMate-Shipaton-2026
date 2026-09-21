import type { EducationLevel } from "@/types";

export type ReadinessMetrics = {
  quizAveragePercent: number;
  pastQuestionsAnsweredCount: number;
  pastQuestionsTotalCount: number;
  flashcardsMasteredCount: number;
  flashcardsTotalCount: number;
  wikiPagesCount: number;
};

export type ReadinessBreakdown = {
  quiz: number;
  pastQuestions: number;
  flashcards: number;
  topics: number;
  overall: number;
};

type ReadinessWeights = {
  quiz: number;
  pastQuestions: number;
  flashcards: number;
  topics: number;
};

const readinessWeightsByLevel: Record<EducationLevel, ReadinessWeights> = {
  primary: {
    quiz: 25,
    pastQuestions: 25,
    flashcards: 30,
    topics: 20,
  },
  secondary: {
    quiz: 30,
    pastQuestions: 30,
    flashcards: 25,
    topics: 15,
  },
  tertiary: {
    quiz: 35,
    pastQuestions: 35,
    flashcards: 20,
    topics: 10,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function safeRatio(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return clamp(numerator / denominator, 0, 1);
}

export function calculateReadinessBreakdown(
  metrics: ReadinessMetrics,
  educationLevel: EducationLevel = "tertiary",
): ReadinessBreakdown {
  const weights = readinessWeightsByLevel[educationLevel] ?? readinessWeightsByLevel.tertiary;
  const quiz = clamp((metrics.quizAveragePercent / 100) * weights.quiz, 0, weights.quiz);
  const pastQuestions =
    safeRatio(metrics.pastQuestionsAnsweredCount, metrics.pastQuestionsTotalCount) * weights.pastQuestions;
  const flashcards = safeRatio(metrics.flashcardsMasteredCount, metrics.flashcardsTotalCount) * weights.flashcards;
  const topics = metrics.wikiPagesCount > 0 ? weights.topics : 0;
  const overall = Math.round(quiz + pastQuestions + flashcards + topics);

  return {
    quiz: Math.round(quiz),
    pastQuestions: Math.round(pastQuestions),
    flashcards: Math.round(flashcards),
    topics,
    overall,
  };
}
