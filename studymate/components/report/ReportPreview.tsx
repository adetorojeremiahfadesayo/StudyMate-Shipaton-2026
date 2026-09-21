"use client";

import { useMemo } from "react";
import {
  CheckCircle2,
  CircleAlert,
  FileText,
  Lightbulb,
  MessageSquareText,
  NotebookTabs,
  Sparkles,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ReadinessRing from "@/components/readiness/ReadinessRing";
import { formatDate, getSubjectMeta } from "@/lib/course-utils";
import type { AocAnswer, Flashcard, KeyPoint, PastQuestion, QuizAttempt, SubjectType, WikiPageType } from "@/types";
import type { ReadinessBreakdown } from "@/lib/readiness";

type ReportPreviewProps = {
  courseName: string;
  subjectType: SubjectType;
  studentName: string;
  generatedAt: string;
  readinessScore: number;
  readinessBreakdown: ReadinessBreakdown;
  materials: { file_name: string; created_at: string }[];
  wikiCountsByType: Record<WikiPageType, number>;
  notesCount: number;
  keyPoints: KeyPoint[];
  pastQuestions: PastQuestion[];
  aocAnswers: AocAnswer[];
  quizAttempts: QuizAttempt[];
  flashcards: Flashcard[];
};

type ChecklistItem = {
  label: string;
  detail: string;
  ready: boolean;
  icon: LucideIcon;
};

function summaryLabel(count: number, singular: string, plural?: string) {
  if (count === 1) {
    return `1 ${singular}`;
  }

  return `${count} ${plural ?? `${singular}s`}`;
}

function ProgressLine({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-600">{label}</span>
        <span className="font-semibold text-gray-950">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${accent}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ReportPreview({
  courseName,
  subjectType,
  studentName,
  generatedAt,
  readinessScore,
  readinessBreakdown,
  materials,
  wikiCountsByType,
  notesCount,
  keyPoints,
  pastQuestions,
  aocAnswers,
  quizAttempts,
  flashcards,
}: ReportPreviewProps) {
  const subjectMeta = getSubjectMeta(subjectType);

  const checklist = useMemo<ChecklistItem[]>(
    () => [
      {
        label: "Notes generated",
        detail: notesCount > 0 ? "Yes, revision notes exist." : "No notes yet.",
        ready: notesCount > 0,
        icon: NotebookTabs,
      },
      {
        label: "Key points extracted",
        detail: summaryLabel(keyPoints.length, "point"),
        ready: keyPoints.length > 0,
        icon: Lightbulb,
      },
      {
        label: "Past questions answered",
        detail: summaryLabel(pastQuestions.filter((item) => item.answer?.trim()).length, "question answered"),
        ready: pastQuestions.some((item) => item.answer?.trim()),
        icon: MessageSquareText,
      },
      {
        label: "AOC answers",
        detail: summaryLabel(aocAnswers.length, "topic"),
        ready: aocAnswers.length > 0,
        icon: Target,
      },
      {
        label: "Quiz attempts",
        detail: quizAttempts.length
          ? `${quizAttempts.length} attempts, avg ${Math.round(
              quizAttempts.reduce((sum, attempt) => sum + Number(attempt.percentage), 0) / quizAttempts.length,
            )}%`
          : "No quiz attempts yet.",
        ready: quizAttempts.length > 0,
        icon: Sparkles,
      },
      {
        label: "Flashcards",
        detail: flashcards.length
          ? `${flashcards.filter((card) => card.status === "mastered").length} mastered of ${flashcards.length}`
          : "No flashcards yet.",
        ready: flashcards.length > 0,
        icon: FileText,
      },
    ],
    [aocAnswers.length, flashcards, keyPoints.length, notesCount, pastQuestions, quizAttempts],
  );

  const materialsPreview = materials.slice(0, 3);
  const remainingMaterials = Math.max(0, materials.length - materialsPreview.length);

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">Exam-ready revision PDF</p>
              <h1 className="text-3xl font-bold tracking-tight text-gray-950">{courseName}</h1>
              <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${subjectMeta.badge}`}>
                {subjectMeta.label}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <p className="font-medium text-gray-950">{studentName}</p>
              <p className="mt-1">Generated {formatDate(generatedAt)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-950">Reward contents</p>
              <div className="mt-4 space-y-3">
                {checklist.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full ${
                          item.ready ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {item.ready ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-950">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.detail}</p>
                      </div>
                      <Icon className="ml-auto mt-0.5 h-4 w-4 text-gray-400" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-950">Materials uploaded</p>
              <div className="mt-4 space-y-3">
                {materialsPreview.length > 0 ? (
                  materialsPreview.map((material) => (
                    <div key={`${material.file_name}-${material.created_at}`} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="text-sm font-medium text-gray-950">{material.file_name}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatDate(material.created_at)}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
                    <p className="text-sm text-gray-500">No materials uploaded yet.</p>
                  </div>
                )}

                {remainingMaterials > 0 ? (
                  <p className="text-xs text-gray-500">+{remainingMaterials} more files</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <ReadinessRing value={readinessScore} />

          <div className="mt-6 space-y-4">
            <ProgressLine label="Quiz" value={readinessBreakdown.quiz} accent="bg-violet-600" />
            <ProgressLine label="Past Questions" value={readinessBreakdown.pastQuestions} accent="bg-blue-600" />
            <ProgressLine label="Flashcards" value={readinessBreakdown.flashcards} accent="bg-emerald-600" />
            <ProgressLine label="Topics" value={readinessBreakdown.topics} accent="bg-amber-500" />
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-950">Wiki pages built</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(wikiCountsByType).map(([type, count]) => (
                <span
                  key={type}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600"
                >
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Notes</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{notesCount > 0 ? "Ready" : "Pending"}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Key points</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{keyPoints.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Past questions</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{pastQuestions.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">AOC topics</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{aocAnswers.length}</p>
        </div>
      </div>

      {materials.length === 0 ||
      notesCount === 0 ||
      keyPoints.length === 0 ||
      pastQuestions.length === 0 ||
      aocAnswers.length === 0 ||
      quizAttempts.length === 0 ||
      flashcards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50 px-6 py-5 text-sm text-violet-900">
          Tip: Complete Upload, Learn, and Exam Prep for a stronger revision PDF.
        </div>
      ) : null}
    </section>
  );
}
