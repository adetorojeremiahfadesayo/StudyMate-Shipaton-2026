"use client";

import { useEffect, useState } from "react";
import { ChevronRight, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import type { QuizQuestion } from "@/types";

type EssayQuestionProps = {
  courseId: string;
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  correctCount: number;
  answeredCount: number;
  onComplete: (result: {
    question: QuizQuestion;
    studentAnswer: string;
    score: number;
    maxScore: number;
    percentage: number;
    grade: "A" | "B" | "C" | "D" | "F";
    feedback: string;
    strengths: string[];
    improvements: string[];
    key_points_covered: string[];
    key_points_missed: string[];
  }) => void;
};

export default function EssayQuestion({
  courseId,
  question,
  questionNumber,
  totalQuestions,
  correctCount,
  answeredCount,
  onComplete,
}: EssayQuestionProps) {
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<"reading" | "comparing" | "calculating">("reading");
  const [result, setResult] = useState<{
    score: number;
    max_score: number;
    percentage: number;
    grade: "A" | "B" | "C" | "D" | "F";
    feedback: string;
    strengths: string[];
    improvements: string[];
    key_points_covered: string[];
    key_points_missed: string[];
  } | null>(null);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const stages: Array<typeof loadingStage> = ["reading", "comparing", "calculating"];
    let index = 0;
    const timer = window.setInterval(() => {
      index = (index + 1) % stages.length;
      setLoadingStage(stages[index]);
    }, 1100);

    return () => window.clearInterval(timer);
  }, [loading]);

  const submitAnswer = async () => {
    if (!draft.trim() || loading) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/agents/quiz-grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          question: question.question,
          studentAnswer: draft,
          modelAnswer: question.model_answer,
          keyPoints: question.key_points,
          marks: question.marks,
        }),
      });

      const data = (await response.json()) as {
        score?: number;
        max_score?: number;
        percentage?: number;
        grade?: "A" | "B" | "C" | "D" | "F";
        feedback?: string;
        strengths?: string[];
        improvements?: string[];
        key_points_covered?: string[];
        key_points_missed?: string[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to grade essay answer.");
      }

      const nextResult = {
        score: data.score ?? 0,
        max_score: data.max_score ?? question.marks ?? 20,
        percentage: data.percentage ?? 0,
        grade: data.grade ?? "F",
        feedback: data.feedback ?? "No feedback returned.",
        strengths: data.strengths ?? [],
        improvements: data.improvements ?? [],
        key_points_covered: data.key_points_covered ?? [],
        key_points_missed: data.key_points_missed ?? [],
      };

      setResult(nextResult);
      toast.success("Essay graded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to grade essay answer.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = Math.round((questionNumber / totalQuestions) * 100);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-500">
            Question {questionNumber} of {totalQuestions} — {question.marks ?? 20} marks
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {answeredCount} answered • {correctCount} correct
          </p>
        </div>
        <p className="text-sm font-semibold text-gray-700">
          {correctCount}/{answeredCount || 1} correct
        </p>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-gray-950">{question.question}</h2>

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-violet-200 hover:text-violet-700"
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {expanded ? "Hide key points" : "Show key points to cover"}
      </button>

      {expanded ? (
        <div className="mt-4 rounded-2xl border border-dashed border-violet-200 bg-violet-50 px-4 py-4 text-sm text-violet-900">
          <p className="font-semibold">Key points to cover: {question.key_points?.length ?? 0} points</p>
          {question.key_points && question.key_points.length > 0 ? (
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {question.key_points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-violet-800">No hint available yet.</p>
          )}
        </div>
      ) : null}

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Write your answer here. Aim for exam conditions — use your own words."
        className="mt-5 min-h-[250px] w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-7 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-300 focus:bg-white"
      />

      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>Tip: write as if you were in the exam hall.</span>
        <span>{draft.trim().split(/\s+/).filter(Boolean).length} words</span>
      </div>

      <button
        type="button"
        onClick={submitAnswer}
        disabled={!draft.trim() || loading || !!result}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading
          ? loadingStage === "reading"
            ? "Reading your answer..."
            : loadingStage === "comparing"
              ? "Comparing with model answer..."
              : "Calculating score..."
          : "Submit for Grading"}
      </button>

      {result ? (
        <div className="mt-6 space-y-4 rounded-3xl border border-gray-200 bg-gray-50 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-3xl font-bold text-gray-950">
              {result.score}/{result.max_score}
            </p>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                result.grade === "A" || result.grade === "B"
                  ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                  : result.grade === "C" || result.grade === "D"
                    ? "bg-amber-100 text-amber-800 ring-amber-200"
                    : "bg-rose-100 text-rose-700 ring-rose-200"
              }`}
            >
              Grade {result.grade}
            </span>
          </div>

          <p className="text-sm leading-7 text-gray-700">{result.feedback}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-900">Strengths</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-emerald-900">
                {result.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Areas to improve</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-900">
                {result.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-950">Key points covered</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.key_points_covered.length > 0 ? (
                  result.key_points_covered.map((point) => (
                    <span
                      key={point}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-800"
                    >
                      {point}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">None recorded.</span>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-950">Key points missed</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.key_points_missed.length > 0 ? (
                  result.key_points_missed.map((point) => (
                    <span
                      key={point}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs text-rose-800"
                    >
                      {point}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">None recorded.</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onComplete({
                question,
                studentAnswer: draft,
                score: result.score,
                maxScore: result.max_score,
                percentage: result.percentage,
                grade: result.grade,
                feedback: result.feedback,
                strengths: result.strengths,
                improvements: result.improvements,
                key_points_covered: result.key_points_covered,
                key_points_missed: result.key_points_missed,
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
          >
            Next Question
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
