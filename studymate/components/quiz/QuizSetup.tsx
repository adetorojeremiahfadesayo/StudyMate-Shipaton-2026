"use client";

import { useMemo } from "react";
import { FileText, Layers3, MessageSquareMore, Sparkles } from "lucide-react";
import { getSubjectMeta } from "@/lib/course-utils";
import type { QuizAttempt, QuizType, SubjectType } from "@/types";

type QuizSetupProps = {
  subjectType: SubjectType;
  selectedType: QuizType | null;
  selectedCount: number | null;
  onSelectType: (type: QuizType) => void;
  onSelectCount: (count: 5 | 10 | 15 | 20) => void;
  onStartQuiz: () => void;
  canStart: boolean;
  loading?: boolean;
  recentAttempts: QuizAttempt[];
};

const types: Array<{
  type: QuizType;
  title: string;
  description: string;
  icon: typeof FileText;
}> = [
  {
    type: "mcq",
    title: "Multiple Choice",
    description: "Test your knowledge with 4-option questions.",
    icon: FileText,
  },
  {
    type: "essay",
    title: "Essay Questions",
    description: "Practice exam answers with AI grading.",
    icon: MessageSquareMore,
  },
  {
    type: "mixed",
    title: "Mixed",
    description: "Both MCQ and essay questions.",
    icon: Layers3,
  },
];

const counts = [5, 10, 15, 20] as const;

function getGradeBadge(grade: string) {
  if (grade === "A" || grade === "B") {
    return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  }
  if (grade === "C" || grade === "D") {
    return "bg-amber-100 text-amber-800 ring-amber-200";
  }
  return "bg-rose-100 text-rose-700 ring-rose-200";
}

export default function QuizSetup({
  subjectType,
  selectedType,
  selectedCount,
  onSelectType,
  onSelectCount,
  onStartQuiz,
  canStart,
  loading = false,
  recentAttempts,
}: QuizSetupProps) {
  const subjectMeta = getSubjectMeta(subjectType);
  const recent = useMemo(() => recentAttempts.slice(0, 3), [recentAttempts]);

  return (
    <section className="space-y-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">Quiz Me</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">Quiz Me</h1>
          <div className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${subjectMeta.badge}`}>
            {subjectMeta.label}
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Build MCQs, essays, or a mixed exam set from your wiki pages.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {types.map((entry) => {
            const Icon = entry.icon;
            const active = selectedType === entry.type;

            return (
              <button
                key={entry.type}
                type="button"
                onClick={() => onSelectType(entry.type)}
                className={`rounded-2xl border px-5 py-5 text-left transition ${
                  active
                    ? "border-violet-300 bg-violet-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-violet-200"
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-950">{entry.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{entry.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-950">Question count</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {counts.map((count) => {
              const active = selectedCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => onSelectCount(count)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-violet-700 text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-violet-200 hover:text-violet-700"
                  }`}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onStartQuiz}
          disabled={!canStart || loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating quiz..." : "Start Quiz"}
        </button>
      </div>

      <section className="mx-auto max-w-4xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-950">Recent quiz scores</h2>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center shadow-sm">
            <p className="text-sm text-gray-600">No quiz attempts yet. Create your first quiz to see history here.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {recent.map((attempt) => (
              <article key={attempt.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getGradeBadge(attempt.grade)}`}
                  >
                    Grade {attempt.grade}
                  </span>
                  <span className="text-sm font-bold text-gray-950">{Math.round(attempt.percentage)}%</span>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  {attempt.quiz_type.toUpperCase()} • {attempt.question_count} questions
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(attempt.created_at ?? "").toLocaleDateString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
