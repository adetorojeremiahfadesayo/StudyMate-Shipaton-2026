import { supabaseAdmin } from "@/lib/supabase-admin";
import { calculateReadinessBreakdown, type ReadinessBreakdown } from "@/lib/readiness";
import type { EducationLevel } from "@/types";
import type {
  AocAnswer,
  CourseNote,
  Flashcard,
  KeyPoint,
  Material,
  PastQuestion,
  QuizAttempt,
  SubjectType,
  WikiPageType,
} from "@/types";

const wikiTypes: WikiPageType[] = ["principle", "case", "formula", "maxim", "definition", "concept"];

export type ReportData = {
  course: {
    id: string;
    name: string;
    subject_type: SubjectType;
    description: string | null;
    created_at: string;
    readiness_score: number | null;
  };
  studentName: string;
  materials: Pick<Material, "file_name" | "created_at">[];
  notes: CourseNote | null;
  keyPoints: KeyPoint[];
  pastQuestions: PastQuestion[];
  aocAnswers: AocAnswer[];
  flashcards: Flashcard[];
  quizAttempts: QuizAttempt[];
  wikiCountsByType: Record<WikiPageType, number>;
  readinessBreakdown: ReadinessBreakdown;
  readinessScore: number;
  quizAveragePercent: number;
  flashcardsMasteredCount: number;
  flashcardsTotalCount: number;
  pastQuestionsAnsweredCount: number;
  pastQuestionsTotalCount: number;
};

function emptyWikiCounts() {
  return wikiTypes.reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as Record<WikiPageType, number>);
}

function averagePercentage(values: number[]) {
  const validValues = values.filter((value) => Number.isFinite(value));
  if (validValues.length === 0) {
    return 0;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

export async function fetchReportData({
  courseId,
  userId,
  studentName,
  educationLevel = "tertiary",
}: {
  courseId: string;
  userId: string;
  studentName: string;
  educationLevel?: EducationLevel;
}): Promise<ReportData> {
  const courseResponse = await supabaseAdmin
    .from("courses")
    .select("id, name, subject_type, description, created_at, readiness_score, user_id")
    .eq("id", courseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (courseResponse.error) {
    throw new Error(courseResponse.error.message);
  }

  if (!courseResponse.data) {
    throw new Error("Course not found.");
  }

  const [
    materialsResponse,
    notesResponse,
    keyPointsResponse,
    pastQuestionsResponse,
    aocAnswersResponse,
    flashcardsResponse,
    quizAttemptsResponse,
    wikiResponse,
  ] = await Promise.all([
    supabaseAdmin
      .from("materials")
      .select("file_name, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("notes")
      .select("id, course_id, content, generated_at, edited_at")
      .eq("course_id", courseId)
      .order("generated_at", { ascending: false })
      .maybeSingle(),
    supabaseAdmin
      .from("key_points")
      .select("id, course_id, type, title, content, source_material, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("past_questions")
      .select("id, course_id, question, answer, confidence, warning_message, source_pages, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("aoc_answers")
      .select("id, course_id, topic, answer, confidence, warning_message, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("flashcards")
      .select("id, course_id, key_point_id, front, back, status, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("quiz_attempts")
      .select(
        "id, course_id, quiz_session_id, quiz_type, question_count, score, max_score, percentage, grade, feedback, strengths, improvements, key_points_covered, key_points_missed, questions_snapshot, answers_snapshot, created_at",
      )
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("wiki_pages")
      .select("type")
      .eq("course_id", courseId),
  ]);

  const materials = (materialsResponse.error ? [] : materialsResponse.data ?? []) as Pick<
    Material,
    "file_name" | "created_at"
  >[];
  const notes = (notesResponse.error ? null : (notesResponse.data as CourseNote | null)) ?? null;
  const keyPoints = (keyPointsResponse.error ? [] : keyPointsResponse.data ?? []) as KeyPoint[];
  const pastQuestions = (pastQuestionsResponse.error ? [] : pastQuestionsResponse.data ?? []) as PastQuestion[];
  const aocAnswers = (aocAnswersResponse.error ? [] : aocAnswersResponse.data ?? []) as AocAnswer[];
  const flashcards = (flashcardsResponse.error ? [] : flashcardsResponse.data ?? []) as Flashcard[];
  const quizAttempts = (quizAttemptsResponse.error ? [] : quizAttemptsResponse.data ?? []) as QuizAttempt[];
  const wikiPages = (wikiResponse.error ? [] : wikiResponse.data ?? []) as Array<{ type: WikiPageType }>;

  const wikiCountsByType = emptyWikiCounts();
  wikiPages.forEach((page) => {
    wikiCountsByType[page.type] += 1;
  });

  const quizAveragePercent = averagePercentage(quizAttempts.map((attempt) => Number(attempt.percentage)));
  const flashcardsMasteredCount = flashcards.filter((card) => card.status === "mastered").length;
  const flashcardsTotalCount = flashcards.length;
  const pastQuestionsTotalCount = pastQuestions.length;
  const pastQuestionsAnsweredCount = pastQuestions.filter((question) => Boolean(question.answer?.trim())).length;

  const readinessBreakdown = calculateReadinessBreakdown({
    quizAveragePercent,
    pastQuestionsAnsweredCount,
    pastQuestionsTotalCount,
    flashcardsMasteredCount,
    flashcardsTotalCount,
    wikiPagesCount: wikiPages.length,
  }, educationLevel);

  return {
    course: {
      id: courseResponse.data.id,
      name: courseResponse.data.name,
      subject_type: courseResponse.data.subject_type,
      description: courseResponse.data.description,
      created_at: courseResponse.data.created_at,
      readiness_score: courseResponse.data.readiness_score,
    },
    studentName: studentName || "Student",
    materials,
    notes,
    keyPoints,
    pastQuestions,
    aocAnswers,
    flashcards,
    quizAttempts,
    wikiCountsByType,
    readinessBreakdown,
    readinessScore: courseResponse.data.readiness_score ?? readinessBreakdown.overall,
    quizAveragePercent: Math.round(quizAveragePercent),
    flashcardsMasteredCount,
    flashcardsTotalCount,
    pastQuestionsAnsweredCount,
    pastQuestionsTotalCount,
  };
}
