import { notFound } from "next/navigation";
import PastQuestionsWorkspace from "@/components/past-questions/PastQuestionsWorkspace";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeEducationLevel } from "@/lib/learning-profile";
import type { PastQuestion } from "@/types";

export const dynamic = "force-dynamic";

type PastQuestionsPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CoursePastQuestionsPage({ params }: PastQuestionsPageProps) {
  const { courseId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id;
  const educationLevel = normalizeEducationLevel(session?.user.user_metadata?.education_level) ?? "tertiary";
  const initialStudyXp = Number(session?.user.user_metadata?.study_xp ?? 0);
  if (!userId) {
    notFound();
  }

  const [courseResponse, historyResponse, sourcesResponse] = await Promise.all([
    supabase
      .from("courses")
      .select("id, name, subject_type")
      .eq("id", courseId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("past_questions")
      .select("id, course_id, question, answer, confidence, warning_message, source_pages, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
    supabase
      .from("wiki_pages")
      .select("title, source_material")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true }),
  ]);

  if (!courseResponse.data) {
    notFound();
  }

  const history = (historyResponse.error ? [] : historyResponse.data ?? []) as PastQuestion[];
  const sourceNames = Array.from(
    new Set(
      (sourcesResponse.error ? [] : sourcesResponse.data ?? [])
        .flatMap((source) => [source.title, source.source_material])
        .filter((source): source is string => Boolean(source)),
    ),
  );

  return (
    <PastQuestionsWorkspace
      courseId={courseId}
      courseName={courseResponse.data.name}
      subjectType={courseResponse.data.subject_type}
      initialQuestions={history}
      educationLevel={educationLevel}
      initialStudyXp={initialStudyXp}
      sourceNames={sourceNames}
    />
  );
}
