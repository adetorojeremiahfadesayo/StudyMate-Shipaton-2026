import Link from "next/link";
import { ArrowRight, Brain, Sparkles } from "lucide-react";
import CourseProgressMap from "@/components/shared/CourseProgressMap";
import { StarterActionGrid, StudyActionPanel } from "@/components/shared/StudyActionPanel";
import WeakAreasPanel from "@/components/shared/WeakAreasPanel";
import { getCourseCoachSummaries } from "@/lib/course-coach-data";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  getCourseProgressSteps,
  getCourseReadiness,
  getStudyActions,
  getWeakAreas,
} from "@/lib/study-recommendations";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const courses = await getCourseCoachSummaries(session?.user.id);
  const allActions = courses.flatMap(getStudyActions);
  const topActions = allActions.slice(0, 6);
  const weakAreas = courses.flatMap(getWeakAreas).slice(0, 6);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950">Recommendations</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              StudyMate reads your uploads, wiki, flashcards, quizzes, and exam practice to choose the next useful action.
            </p>
          </div>

          <Link
            href="/courses/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
          >
            Add material
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <StarterActionGrid />
      ) : (
        <>
          {topActions.length > 0 ? (
            <div className="grid gap-4">
              {topActions.map((action, index) => (
                <StudyActionPanel
                  key={action.id}
                  action={action}
                  title={index === 0 ? "Top recommendation" : "Recommended action"}
                  compact
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-950">Everything important is moving</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    Keep cycling through quizzes, past questions, and flashcard review to maintain readiness.
                  </p>
                </div>
              </div>
            </div>
          )}

          <WeakAreasPanel weakAreas={weakAreas} />

          <div className="grid gap-5">
            {courses.map((course) => {
              const readiness = getCourseReadiness(course).overall;
              return (
                <article key={course.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-950">{course.name}</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        Readiness {course.readinessScore ?? readiness}% · {course.metrics.materialsTotal} materials · {course.metrics.quizAttemptsCount} quiz attempts
                      </p>
                    </div>
                    <Link
                      href={`/courses/${course.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-violet-200 hover:text-violet-700"
                    >
                      Open course
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <CourseProgressMap steps={getCourseProgressSteps(course)} />
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
