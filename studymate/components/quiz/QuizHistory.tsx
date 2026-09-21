"use client";

import { CalendarDays, ChevronRight, ShieldCheck } from "lucide-react";
import type { QuizAttempt } from "@/types";

type QuizHistoryProps = {
  attempts: QuizAttempt[];
  onSelectAttempt: (attempt: QuizAttempt) => void;
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

export default function QuizHistory({ attempts, onSelectAttempt }: QuizHistoryProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-950">Quiz History</h2>
          <p className="mt-1 text-sm text-gray-500">All past quiz attempts for this course.</p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
          <p className="text-sm text-gray-600">No quiz attempts yet.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {attempts.map((attempt) => (
            <button
              key={attempt.id}
              type="button"
              onClick={() => onSelectAttempt(attempt)}
              className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-left transition hover:border-violet-200 hover:bg-violet-50"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${gradeBadge(attempt.grade)}`}>
                    Grade {attempt.grade}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
                    {attempt.quiz_type.toUpperCase()}
                  </span>
                </div>
                <p className="mt-3 truncate text-sm font-semibold text-gray-950">
                  {attempt.percentage}% • {attempt.question_count} questions
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Score {attempt.score}/{attempt.max_score}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(attempt.created_at ?? "").toLocaleDateString()}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
