import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import type { WeakArea } from "@/lib/study-recommendations";

type WeakAreasPanelProps = {
  weakAreas: WeakArea[];
  emptyTitle?: string;
  emptyBody?: string;
};

const toneClass: Record<WeakArea["tone"], string> = {
  violet: "border-violet-100 bg-violet-50 text-violet-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  rose: "border-rose-100 bg-rose-50 text-rose-700",
  cyan: "border-cyan-100 bg-cyan-50 text-cyan-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

export default function WeakAreasPanel({
  weakAreas,
  emptyTitle = "No urgent weak areas",
  emptyBody = "The next step is to keep practicing and package your strongest revision material.",
}: WeakAreasPanelProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-950">Weak areas</h2>
          <p className="text-sm text-gray-600">StudyMate checks gaps in sources, recall, practice, and confidence.</p>
        </div>
      </div>

      {weakAreas.length > 0 ? (
        <div className="mt-5 space-y-3">
          {weakAreas.map((area) => (
            <Link
              key={area.id}
              href={area.href}
              className={`block rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${toneClass[area.tone]}`}
            >
              <h3 className="text-sm font-bold text-gray-950">{area.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">{area.body}</p>
              <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold">
                {area.cta}
                <ArrowRight className="h-4 w-4" />
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-950">{emptyTitle}</p>
              <p className="mt-1 text-sm leading-6 text-gray-700">{emptyBody}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
