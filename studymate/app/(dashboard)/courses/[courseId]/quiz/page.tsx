import { notFound } from "next/navigation";
import QuizWorkspace from "@/components/quiz/QuizWorkspace";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { QuizAttempt } from "@/types";

export const dynamic = "force-dynamic";

type QuizPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseQuizPage({ params }: QuizPageProps) {
  const { courseId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id;
  if (!userId) {
    notFound();
  }

  const [courseResponse, attemptsResponse] = await Promise.all([
    supabase
      .from("courses")
      .select("id, name, subject_type")
      .eq("id", courseId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("quiz_attempts")
      .select(
        "id, course_id, quiz_session_id, quiz_type, question_count, score, max_score, percentage, grade, feedback, strengths, improvements, key_points_covered, key_points_missed, questions_snapshot, answers_snapshot, created_at",
      )
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
  ]);

  if (!courseResponse.data) {
    notFound();
  }

  const attempts = (attemptsResponse.error ? [] : attemptsResponse.data ?? []) as QuizAttempt[];

  return (
    <QuizWorkspace
      courseId={courseId}
      courseName={courseResponse.data.name}
      subjectType={courseResponse.data.subject_type}
      initialAttempts={attempts}
    />
  );
}
