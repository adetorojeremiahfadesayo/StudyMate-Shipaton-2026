"use client";

import { useMemo } from "react";
import { CheckCircle2, RotateCcw, ArrowLeft, FileText, XCircle } from "lucide-react";
import type { QuizAttempt, QuizQuestion, QuizType } from "@/types";

type QuizAnswerRecord = {
  questionId: string;
  isCorrect?: boolean;
  score: number;
  maxScore: number;
  selectedAnswer?: string;
  studentAnswer?: string;
};

type QuizResultsProps = {
  quizType: QuizType;
  courseName: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: "A" | "B" | "C" | "D" | "F";
  questions: QuizQuestion[];
  answers: QuizAnswerRecord[];
  onRetakeQuiz: () => void;
  onReviewWrongAnswers: () => void;
  onReturnToCourse: () => void;
  reviewOnly?: boolean;
  reviewAttempt?: QuizAttempt | null;
};

function gradeBadge(grade: string) {
  if (grade === "A" || grade === "B") {
    return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  }
  if (grade === "C" || grade === "D") {
    return "bg-amber-100 text-amber-800 ring-amber-200";
  }
  return "bg-rose-100 text-rose-700 ring-rose-200";
}

export default function QuizResults({
  quizType,
  courseName,
  score,
  maxScore,
  percentage,
  grade,
  questions,
  answers,
  onRetakeQuiz,
  onReviewWrongAnswers,
  onReturnToCourse,
  reviewOnly = false,
  reviewAttempt = null,
}: QuizResultsProps) {
  const ringSize = 180;
  const strokeWidth = 12;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(100, percentage)) / 100);

  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const wrongCount = Math.max(0, answers.length - correctCount);
  const essayScores = answers.map((answer) => answer.score).filter((value) => value > 1 || maxScore > 1);
  const averageScore = essayScores.length > 0 ? Math.round(essayScores.reduce((sum, value) => sum + value, 0) / essayScores.length) : score;
  const maxEssay = Math.max(...answers.map((answer) => answer.score), 0);
  const minEssay = Math.min(...answers.map((answer) => answer.score), maxScore || 0);

  const reviewedQuestions = useMemo(() => {
    if (!reviewOnly) {
      return questions;
    }

    return questions.filter((question) => {
      const answer = answers.find((entry) => entry.questionId === question.id);
      return answer ? !answer.isCorrect : true;
    });
  }, [answers, questions, reviewOnly]);

  const topicRows = questions.map((question) => {
    const answer = answers.find((entry) => entry.questionId === question.id);
    return {
      topic: question.topic ?? question.source_material ?? "Topic",
      correct: answer?.isCorrect ?? false,
      question,
      answer,
    };
  });

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">Quiz Results</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">{courseName}</h1>
            <p className="mt-2 text-sm text-gray-600">
              {quizType.toUpperCase()} • {questions.length} questions
              {reviewAttempt ? ` • Reviewing ${reviewAttempt.question_count} question attempt` : ""}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <div className="relative" style={{ width: ringSize, height: ringSize }}>
                <svg
                  className="h-full w-full -rotate-90 transform"
                  viewBox={`0 0 ${ringSize} ${ringSize}`}
                  aria-label={`Quiz score ${percentage} percent`}
                  role="img"
                >
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    stroke="#E5E7EB"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    stroke="#7C3AED"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-950">{percentage}%</span>
                  <span className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${gradeBadge(grade)}`}>
                    Grade {grade}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Score</p>
            <p className="mt-2 text-3xl font-bold text-gray-950">
              {score}/{maxScore}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Correct</p>
            <p className="mt-2 text-3xl font-bold text-gray-950">{correctCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Wrong</p>
            <p className="mt-2 text-3xl font-bold text-gray-950">{wrongCount}</p>
          </div>
        </div>

        {quizType === "essay" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Average score</p>
              <p className="mt-2 text-2xl font-bold text-gray-950">{averageScore}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Highest</p>
              <p className="mt-2 text-2xl font-bold text-gray-950">{maxEssay}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Lowest</p>
              <p className="mt-2 text-2xl font-bold text-gray-950">{minEssay}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-950">Topic breakdown</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {topicRows.map((row) => (
              <span
                key={`${row.topic}-${row.question.id}`}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                  row.correct
                    ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                    : "bg-rose-100 text-rose-700 ring-rose-200"
                }`}
              >
                {row.correct ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {row.topic}
              </span>
            ))}
          </div>
        </div>

        {reviewOnly ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-semibold text-gray-950">Wrong answers only</p>
            <div className="mt-4 space-y-3">
              {reviewedQuestions.length > 0 ? (
                reviewedQuestions.map((question) => {
                  const answer = answers.find((entry) => entry.questionId === question.id);
                  return (
                    <div key={question.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-sm font-semibold text-gray-950">{question.question}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        {answer?.selectedAnswer ? `Your answer: ${answer.selectedAnswer}` : "No answer captured."}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-600">No wrong answers to review.</p>
              )}
            </div>
          </div>
        ) : null}

        {reviewAttempt ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-semibold text-gray-950">Attempt review</p>
            <div className="mt-4 space-y-3">
              {(reviewAttempt.questions_snapshot ?? []).map((question, index) => (
                <div key={`${question.id}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-gray-950">{question.question}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {question.type.toUpperCase()} • {question.topic ?? question.source_material ?? "Topic"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetakeQuiz}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
          >
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </button>
          <button
            type="button"
            onClick={onReviewWrongAnswers}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-violet-200 hover:text-violet-700"
          >
            <FileText className="h-4 w-4" />
            Review Wrong Answers
          </button>
          <button
            type="button"
            onClick={onReturnToCourse}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-violet-200 hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Course
          </button>
        </div>
      </div>
    </section>
  );
}
