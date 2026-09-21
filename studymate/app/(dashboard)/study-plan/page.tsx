import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { StarterActionGrid } from "@/components/shared/StudyActionPanel";
import { getCourseCoachSummaries } from "@/lib/course-coach-data";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getStudyActions, getWeakAreas } from "@/lib/study-recommendations";

export const dynamic = "force-dynamic";

export default async function StudyPlanPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const courses = await getCourseCoachSummaries(session?.user.id);
  const actions = courses.flatMap(getStudyActions).slice(0, 5);
  const weakAreas = courses.flatMap(getWeakAreas).slice(0, 3);

  const planRows = [
    {
      label: "Warm up",
      time: "10 min",
      title: actions[0]?.title ?? "Create your first study flow",
      body: actions[0]?.body ?? "Upload material so StudyMate can turn it into grounded study tasks.",
      href: actions[0]?.href ?? "/courses/new",
      cta: actions[0]?.cta ?? "Create course",
    },
    {
      label: "Deep work",
      time: "25 min",
      title: weakAreas[0]?.title ?? "Learn from source material",
      body: weakAreas[0]?.body ?? "Read one explanation, then convert it into flashcards or an exam attempt.",
      href: weakAreas[0]?.href ?? "/courses",
      cta: weakAreas[0]?.cta ?? "Open courses",
    },
    {
      label: "Proof",
      time: "15 min",
      title: actions[1]?.title ?? "Practice one answer",
      body: actions[1]?.body ?? "Use a quiz or past question to check what actually stuck.",
      href: actions[1]?.href ?? "/recommendations",
      cta: actions[1]?.cta ?? "See recommendation",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
              <CalendarDays className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950">Study Plan</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              A simple daily loop generated from your current course gaps: warm up, deep work, then proof through practice.
            </p>
          </div>
          <Link
            href="/recommendations"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
          >
            View all recommendations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <StarterActionGrid />
      ) : (
        <div className="grid gap-4">
          {planRows.map((row, index) => (
            <article key={row.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    {index === 2 ? <CheckCircle2 className="h-5 w-5" /> : index === 1 ? <Sparkles className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                      {row.label} · {row.time}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-gray-950">{row.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">{row.body}</p>
                  </div>
                </div>
                <Link
                  href={row.href}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-violet-200 hover:text-violet-700"
                >
                  {row.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
