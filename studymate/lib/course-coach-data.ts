import { DEMO_COURSE, DEMO_REPORT_SUMMARY } from "@/lib/demo-data";
import { IS_DEMO_MODE } from "@/lib/demo-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { CourseCoachMetrics, CourseCoachSummary } from "@/lib/study-recommendations";
import { emptyCoachMetrics } from "@/lib/study-recommendations";

type CourseRow = {
  id: string;
  name: string;
  subject_type: string;
  description?: string | null;
  created_at: string;
  readiness_score?: number | null;
};

function incrementMetric(map: Map<string, CourseCoachMetrics>, courseId: string, key: keyof CourseCoachMetrics, by = 1) {
  const metrics = map.get(courseId);
  if (!metrics) return;
  metrics[key] += by;
}

function demoCoachSummary(): CourseCoachSummary {
  return {
    id: DEMO_COURSE.id,
    name: DEMO_COURSE.name,
    subjectType: DEMO_COURSE.subject_type,
    description: DEMO_COURSE.description,
    createdAt: DEMO_COURSE.created_at,
    readinessScore: DEMO_REPORT_SUMMARY.readinessScore,
    metrics: {
      materialsTotal: DEMO_REPORT_SUMMARY.materials.length,
      materialsReady: DEMO_REPORT_SUMMARY.materials.length,
      materialsFailed: 0,
      notesCount: DEMO_REPORT_SUMMARY.notesCount,
      wikiPagesCount: Object.values(DEMO_REPORT_SUMMARY.wikiCountsByType).reduce((sum, count) => sum + count, 0),
      keyPointsCount: DEMO_REPORT_SUMMARY.keyPointsCount,
      flashcardsTotal: DEMO_REPORT_SUMMARY.flashcardsTotal,
      flashcardsMastered: DEMO_REPORT_SUMMARY.flashcardsMastered,
      pastQuestionsTotal: DEMO_REPORT_SUMMARY.pastQuestionsTotalCount,
      pastQuestionsAnswered: DEMO_REPORT_SUMMARY.pastQuestionsAnsweredCount,
      quizAttemptsCount: DEMO_REPORT_SUMMARY.quizAttemptsCount,
      quizAveragePercent: DEMO_REPORT_SUMMARY.quizAverage,
      lowConfidenceAnswers: 0,
    },
  };
}

export async function getCourseCoachSummaries(userId: string | undefined | null): Promise<CourseCoachSummary[]> {
  if (!userId) {
    return IS_DEMO_MODE ? [demoCoachSummary()] : [];
  }

  const { data: coursesData, error: coursesError } = await supabaseAdmin
    .from("courses")
    .select("id, name, subject_type, description, created_at, readiness_score")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const courses = (coursesError ? [] : coursesData ?? []) as CourseRow[];
  if (courses.length === 0) {
    return IS_DEMO_MODE ? [demoCoachSummary()] : [];
  }

  const courseIds = courses.map((course) => course.id);
  const metricsByCourse = new Map<string, CourseCoachMetrics>();
  courseIds.forEach((courseId) => metricsByCourse.set(courseId, emptyCoachMetrics()));

  const [
    materialsResponse,
    notesResponse,
    wikiResponse,
    keyPointsResponse,
    flashcardsResponse,
    pastQuestionsResponse,
    quizAttemptsResponse,
  ] = await Promise.all([
    supabaseAdmin.from("materials").select("course_id, ocr_status").in("course_id", courseIds),
    supabaseAdmin.from("notes").select("course_id").in("course_id", courseIds),
    supabaseAdmin.from("wiki_pages").select("course_id").in("course_id", courseIds),
    supabaseAdmin.from("key_points").select("course_id").in("course_id", courseIds),
    supabaseAdmin.from("flashcards").select("course_id, status").in("course_id", courseIds),
    supabaseAdmin.from("past_questions").select("course_id, answer, confidence").in("course_id", courseIds),
    supabaseAdmin.from("quiz_attempts").select("course_id, percentage").in("course_id", courseIds),
  ]);

  (materialsResponse.error ? [] : materialsResponse.data ?? []).forEach((material) => {
    incrementMetric(metricsByCourse, material.course_id, "materialsTotal");
    if (material.ocr_status === "complete") incrementMetric(metricsByCourse, material.course_id, "materialsReady");
    if (material.ocr_status === "failed") incrementMetric(metricsByCourse, material.course_id, "materialsFailed");
  });

  (notesResponse.error ? [] : notesResponse.data ?? []).forEach((note) => {
    incrementMetric(metricsByCourse, note.course_id, "notesCount");
  });

  (wikiResponse.error ? [] : wikiResponse.data ?? []).forEach((page) => {
    incrementMetric(metricsByCourse, page.course_id, "wikiPagesCount");
  });

  (keyPointsResponse.error ? [] : keyPointsResponse.data ?? []).forEach((point) => {
    incrementMetric(metricsByCourse, point.course_id, "keyPointsCount");
  });

  (flashcardsResponse.error ? [] : flashcardsResponse.data ?? []).forEach((card) => {
    incrementMetric(metricsByCourse, card.course_id, "flashcardsTotal");
    if (card.status === "mastered") incrementMetric(metricsByCourse, card.course_id, "flashcardsMastered");
  });

  (pastQuestionsResponse.error ? [] : pastQuestionsResponse.data ?? []).forEach((question) => {
    incrementMetric(metricsByCourse, question.course_id, "pastQuestionsTotal");
    if (question.answer?.trim()) incrementMetric(metricsByCourse, question.course_id, "pastQuestionsAnswered");
    if (question.confidence === "low") incrementMetric(metricsByCourse, question.course_id, "lowConfidenceAnswers");
  });

  const quizTotals = new Map<string, { sum: number; count: number }>();
  (quizAttemptsResponse.error ? [] : quizAttemptsResponse.data ?? []).forEach((attempt) => {
    incrementMetric(metricsByCourse, attempt.course_id, "quizAttemptsCount");
    const total = quizTotals.get(attempt.course_id) ?? { sum: 0, count: 0 };
    total.sum += Number(attempt.percentage ?? 0);
    total.count += 1;
    quizTotals.set(attempt.course_id, total);
  });

  quizTotals.forEach((total, courseId) => {
    const metrics = metricsByCourse.get(courseId);
    if (metrics) {
      metrics.quizAveragePercent = total.count > 0 ? Math.round(total.sum / total.count) : 0;
    }
  });

  return courses.map((course) => ({
    id: course.id,
    name: course.name,
    subjectType: course.subject_type,
    description: course.description,
    createdAt: course.created_at,
    readinessScore: course.readiness_score,
    metrics: metricsByCourse.get(course.id) ?? emptyCoachMetrics(),
  }));
}

export async function getCourseCoachSummary(userId: string | undefined | null, courseId: string) {
  const courses = await getCourseCoachSummaries(userId);
  return courses.find((course) => course.id === courseId) ?? (IS_DEMO_MODE && courseId === DEMO_COURSE.id ? demoCoachSummary() : null);
}
