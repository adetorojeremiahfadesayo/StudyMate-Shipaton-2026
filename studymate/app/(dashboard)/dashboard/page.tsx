import Image from "next/image";
import Link from "next/link";
import { Brain, BookOpen, CheckCircle, FileText, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ReadinessRing from "@/components/readiness/ReadinessRing";
import { StarterActionGrid, StudyActionPanel } from "@/components/shared/StudyActionPanel";
import WeakAreasPanel from "@/components/shared/WeakAreasPanel";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { calculateReadinessBreakdown } from "@/lib/readiness";
import { getDisplayName } from "@/lib/course-utils";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getLearningProfileLabel, normalizeEducationLevel } from "@/lib/learning-profile";
import { getMilestoneBadgeAsset } from "@/lib/studymate-assets";
import { getCourseCoachSummaries } from "@/lib/course-coach-data";
import { getBestStudyAction, getWeakAreas } from "@/lib/study-recommendations";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
  name: string;
  created_at: string;
  readiness_score: number | null;
};

type CourseMetric = {
  quizPercentSum: number;
  quizCount: number;
  pastQuestionsTotal: number;
  pastQuestionsAnswered: number;
  flashcardsTotal: number;
  flashcardsMastered: number;
  wikiPages: number;
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const currentUser = session?.user ?? null;
  const displayName = getDisplayName(
    currentUser?.user_metadata?.full_name,
    currentUser?.email,
  );
  const educationLevel = normalizeEducationLevel(currentUser?.user_metadata?.education_level) ?? "tertiary";
  const learningProfile = getLearningProfileLabel(currentUser?.user_metadata ?? null);
  const milestoneBadge = getMilestoneBadgeAsset(learningProfile.title);
  const coachSummaries = await getCourseCoachSummaries(currentUser?.id);
  const bestAction = getBestStudyAction(coachSummaries);
  const weakAreas = coachSummaries.flatMap(getWeakAreas).slice(0, 4);

  let courseCount = 0;
  let notesCount = 0;
  let pastQuestionsAnsweredCount = 0;
  let quizAttemptsCount = 0;
  let recentCourses: CourseRow[] = [];
  let readinessPercent = 0;

  if (currentUser) {
    const { data: coursesData, error: coursesError } = await supabaseAdmin
      .from("courses")
      .select("id, name, created_at, readiness_score")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (!coursesError && coursesData) {
      recentCourses = coursesData as CourseRow[];
      courseCount = recentCourses.length;
    }

    const courseIds = recentCourses.map((course) => course.id);

    if (courseIds.length > 0) {
      const [notesResponse, pastQuestionsResponse, flashcardsResponse, quizAttemptsResponse, wikiPagesResponse] = await Promise.all([
        supabaseAdmin
          .from("notes")
          .select("id", { count: "exact", head: true })
          .in("course_id", courseIds),
        supabaseAdmin
          .from("past_questions")
          .select("course_id, answer")
          .in("course_id", courseIds),
        supabaseAdmin
          .from("flashcards")
          .select("course_id, status")
          .in("course_id", courseIds),
        supabaseAdmin
          .from("quiz_attempts")
          .select("course_id, percentage")
          .in("course_id", courseIds),
        supabaseAdmin
          .from("wiki_pages")
          .select("course_id")
          .in("course_id", courseIds),
      ]);

      notesCount = notesResponse.count ?? 0;
      pastQuestionsAnsweredCount = (pastQuestionsResponse.data ?? []).filter((entry) => Boolean(entry.answer?.trim())).length;
      quizAttemptsCount = quizAttemptsResponse.data?.length ?? 0;

      const metricsByCourse = new Map<string, CourseMetric>();
      courseIds.forEach((courseId) => {
        metricsByCourse.set(courseId, {
          quizPercentSum: 0,
          quizCount: 0,
          pastQuestionsTotal: 0,
          pastQuestionsAnswered: 0,
          flashcardsTotal: 0,
          flashcardsMastered: 0,
          wikiPages: 0,
        });
      });

      (pastQuestionsResponse.data ?? []).forEach((entry) => {
        const metrics = metricsByCourse.get(entry.course_id);
        if (!metrics) return;
        metrics.pastQuestionsTotal += 1;
        if (Boolean(entry.answer?.trim())) {
          metrics.pastQuestionsAnswered += 1;
        }
      });

      (flashcardsResponse.data ?? []).forEach((entry) => {
        const metrics = metricsByCourse.get(entry.course_id);
        if (!metrics) return;
        metrics.flashcardsTotal += 1;
        if (entry.status === "mastered") {
          metrics.flashcardsMastered += 1;
        }
      });

      (quizAttemptsResponse.data ?? []).forEach((entry) => {
        const metrics = metricsByCourse.get(entry.course_id);
        if (!metrics) return;
        metrics.quizPercentSum += Number(entry.percentage ?? 0);
        metrics.quizCount += 1;
      });

      (wikiPagesResponse.data ?? []).forEach((entry) => {
        const metrics = metricsByCourse.get(entry.course_id);
        if (!metrics) return;
        metrics.wikiPages += 1;
      });

      const updates = recentCourses.map(async (course) => {
        const metrics = metricsByCourse.get(course.id);
        if (!metrics) {
          return course.readiness_score ?? 0;
        }

        const quizAveragePercent = metrics.quizCount > 0 ? metrics.quizPercentSum / metrics.quizCount : 0;
        const readinessBreakdown = calculateReadinessBreakdown({
          quizAveragePercent,
          pastQuestionsAnsweredCount: metrics.pastQuestionsAnswered,
          pastQuestionsTotalCount: metrics.pastQuestionsTotal,
          flashcardsMasteredCount: metrics.flashcardsMastered,
          flashcardsTotalCount: metrics.flashcardsTotal,
          wikiPagesCount: metrics.wikiPages,
        }, educationLevel);

        if (course.readiness_score !== readinessBreakdown.overall) {
          await supabaseAdmin.from("courses").update({ readiness_score: readinessBreakdown.overall }).eq("id", course.id);
        }

        return readinessBreakdown.overall;
      });

      const readinessResults = await Promise.allSettled(updates);
      const readinessScores = readinessResults.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        }
        return recentCourses[index]?.readiness_score ?? 0;
      });

      readinessPercent = readinessScores.length
        ? Math.round(readinessScores.reduce((sum, value) => sum + value, 0) / readinessScores.length)
        : 0;

      recentCourses = recentCourses.map((course, index) => ({
        ...course,
        readiness_score: readinessScores[index] ?? course.readiness_score ?? 0,
      }));

    }
  }

  const latestCourses = recentCourses.slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Welcome back, {displayName}. Matey has your next study move ready.</p>
      </section>

      {bestAction ? (
        <StudyActionPanel action={bestAction} />
      ) : (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-950">Start your StudyMate flow</h2>
            <p className="mt-2 text-sm text-gray-600">Create a course, upload material, and StudyMate will start recommending the next action.</p>
          </div>
          <StarterActionGrid />
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-purple-700 to-fuchsia-700 p-6 text-white shadow-sm">
          <div className="absolute right-5 top-5 hidden h-20 w-20 overflow-hidden rounded-2xl bg-white/15 p-1 ring-1 ring-white/20 sm:block">
            <Image
              src={milestoneBadge.src}
              alt={milestoneBadge.alt}
              width={80}
              height={80}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="pr-0 sm:pr-24">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-100">Study Profile</p>
            <h3 className="mt-2 text-2xl font-bold">{learningProfile.milestone}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-50">
              Your current level is {educationLevel}. StudyMate will keep the explanations, stories, and exam practice
              tuned to that stage while your XP climbs.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{learningProfile.label}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                Next milestone at {learningProfile.nextThreshold} XP
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">XP Progress</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">{learningProfile.xp}</p>
              <p className="text-sm text-gray-500">Total Study XP</p>
            </div>
            <div className="rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700">
              {learningProfile.progressToNext}% to next level
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all"
              style={{ width: `${learningProfile.progressToNext}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Story mode, quizzes, and answer practice can now feed your study rank over time.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <ReadinessRing value={readinessPercent} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={BookOpen} label="Courses" value={courseCount} />
          <StatCard icon={FileText} label="Notes Generated" value={notesCount} />
          <StatCard
            icon={CheckCircle}
            label="Past Questions Answered"
            value={pastQuestionsAnsweredCount}
          />
          <StatCard icon={Brain} label="Quizzes Taken" value={quizAttemptsCount} />
        </div>
      </section>

      <WeakAreasPanel
        weakAreas={weakAreas}
        emptyTitle="Your study flow is balanced"
        emptyBody="Keep cycling through Learn, Practice, Quiz, and PDF export to build exam confidence."
      />

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Courses</h3>
            <p className="text-sm text-gray-500">Your latest three courses at a glance.</p>
          </div>

          <Link
            href="/courses/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </Link>
        </div>

        {latestCourses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <p className="text-sm text-gray-600">No courses yet. Create your first course!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {latestCourses.map((course) => (
              <article key={course.id} className="rounded-xl border border-gray-200 p-4">
                <p className="text-base font-semibold text-gray-900">{course.name}</p>
                <p className="mt-1 text-sm text-gray-500">
                  Created {new Date(course.created_at).toLocaleDateString()}
                </p>
                <div className="mt-3 inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                  Readiness {course.readiness_score ?? 0}%
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
