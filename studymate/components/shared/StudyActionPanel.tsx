import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  FileText,
  Layers3,
  LibraryBig,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StudyAction, StudyActionIcon, StudyActionTone } from "@/lib/study-recommendations";

type StudyActionPanelProps = {
  title?: string;
  eyebrow?: string;
  action: StudyAction;
  compact?: boolean;
};

const iconMap: Record<StudyActionIcon, LucideIcon> = {
  upload: UploadCloud,
  wiki: LibraryBig,
  learn: BookOpen,
  flashcards: Layers3,
  practice: Sparkles,
  quiz: Brain,
  pdf: FileText,
  source: ShieldCheck,
  weak: AlertTriangle,
};

const toneClasses: Record<StudyActionTone, { shell: string; icon: string; button: string; eyebrow: string }> = {
  violet: {
    shell: "border-violet-100 bg-violet-50",
    icon: "bg-white text-violet-700",
    button: "bg-violet-700 text-white hover:bg-violet-800",
    eyebrow: "text-violet-700",
  },
  emerald: {
    shell: "border-emerald-100 bg-emerald-50",
    icon: "bg-white text-emerald-700",
    button: "bg-emerald-700 text-white hover:bg-emerald-800",
    eyebrow: "text-emerald-700",
  },
  amber: {
    shell: "border-amber-100 bg-amber-50",
    icon: "bg-white text-amber-700",
    button: "bg-amber-600 text-white hover:bg-amber-700",
    eyebrow: "text-amber-700",
  },
  rose: {
    shell: "border-rose-100 bg-rose-50",
    icon: "bg-white text-rose-700",
    button: "bg-rose-600 text-white hover:bg-rose-700",
    eyebrow: "text-rose-700",
  },
  cyan: {
    shell: "border-cyan-100 bg-cyan-50",
    icon: "bg-white text-cyan-700",
    button: "bg-cyan-700 text-white hover:bg-cyan-800",
    eyebrow: "text-cyan-700",
  },
  slate: {
    shell: "border-slate-200 bg-slate-50",
    icon: "bg-white text-slate-700",
    button: "bg-slate-950 text-white hover:bg-slate-800",
    eyebrow: "text-slate-600",
  },
};

export function StudyActionPanel({ title = "Next best action", eyebrow, action, compact = false }: StudyActionPanelProps) {
  const Icon = iconMap[action.icon];
  const tone = toneClasses[action.tone];

  return (
    <section className={`rounded-2xl border p-5 shadow-sm ${tone.shell} ${compact ? "" : "sm:p-6"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${tone.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.18em] ${tone.eyebrow}`}>
              {eyebrow ?? title}
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-gray-950">{action.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">{action.body}</p>
            {action.courseName ? (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {action.courseName}
              </p>
            ) : null}
          </div>
        </div>

        <Link
          href={action.href}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${tone.button}`}
        >
          {action.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export function StarterActionGrid() {
  const actions = [
    {
      title: "Create your first course",
      body: "Set the subject and learning level before uploading material.",
      href: "/courses/new",
      cta: "Create course",
      icon: UploadCloud,
    },
    {
      title: "Try the judge demo",
      body: "See the full upload, story, exam prep, XP, and PDF path.",
      href: "/demo",
      cta: "Open demo",
      icon: Sparkles,
    },
    {
      title: "Build a study rhythm",
      body: "Use recommendations after your first upload to choose what to do next.",
      href: "/recommendations",
      cta: "View recommendations",
      icon: Brain,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.title}
            href={action.href}
            className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-950">{action.title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">{action.body}</p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
              {action.cta}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </p>
          </Link>
        );
      })}
    </div>
  );
}
