import Link from "next/link";
import { BookOpen, CheckCircle2, FileText, Lock, Sparkles, UploadCloud } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CourseProgressStep, StudyActionIcon } from "@/lib/study-recommendations";

type CourseProgressMapProps = {
  steps: CourseProgressStep[];
};

const iconMap: Record<StudyActionIcon, LucideIcon> = {
  upload: UploadCloud,
  wiki: BookOpen,
  learn: BookOpen,
  flashcards: BookOpen,
  practice: Sparkles,
  quiz: Sparkles,
  pdf: FileText,
  source: BookOpen,
  weak: Sparkles,
};

export default function CourseProgressMap({ steps }: CourseProgressMapProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-950">Study path</h2>
          <p className="mt-1 text-sm text-gray-600">Upload, learn, practice, then package a revision PDF.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = iconMap[step.icon];
          const isLocked = step.status === "locked";
          const stateClass =
            step.status === "done"
              ? "border-emerald-200 bg-emerald-50"
              : step.status === "current"
                ? "border-violet-200 bg-violet-50"
                : "border-gray-200 bg-gray-50";
          const iconClass =
            step.status === "done"
              ? "bg-emerald-600 text-white"
              : step.status === "current"
                ? "bg-violet-700 text-white"
                : "bg-gray-200 text-gray-500";

          const content = (
            <div className={`h-full rounded-2xl border p-4 transition ${stateClass} ${isLocked ? "" : "hover:-translate-y-0.5 hover:shadow-sm"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
                  {step.status === "done" ? <CheckCircle2 className="h-5 w-5" /> : isLocked ? <Lock className="h-4 w-4" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className="text-xs font-bold text-gray-400">0{index + 1}</span>
              </div>
              <h3 className="mt-4 text-sm font-bold text-gray-950">{step.label}</h3>
              <p className="mt-2 text-xs leading-5 text-gray-600">{step.detail}</p>
            </div>
          );

          return isLocked ? (
            <div key={step.id}>{content}</div>
          ) : (
            <Link key={step.id} href={step.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
