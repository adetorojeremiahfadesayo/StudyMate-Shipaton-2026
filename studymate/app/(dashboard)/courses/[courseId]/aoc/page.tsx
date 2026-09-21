import { notFound } from "next/navigation";
import AOCWorkspace from "@/components/aoc/AOCWorkspace";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeEducationLevel } from "@/lib/learning-profile";
import type { AocAnswer } from "@/types";

export const dynamic = "force-dynamic";

type AOCPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseAOCPage({ params }: AOCPageProps) {
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

  const [courseResponse, answersResponse] = await Promise.all([
    supabase
      .from("courses")
      .select("id, name, subject_type")
      .eq("id", courseId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("aoc_answers")
      .select("id, course_id, topic, answer, confidence, warning_message, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
  ]);

  if (!courseResponse.data) {
    notFound();
  }

  const initialAnswers = (answersResponse.error ? [] : answersResponse.data ?? []) as AocAnswer[];

  const uniqueLatestAnswers = Array.from(
    initialAnswers.reduce((map, entry) => {
      if (!map.has(entry.topic)) {
        map.set(entry.topic, entry);
      }
      return map;
    }, new Map<string, AocAnswer>()),
    ([, value]) => value,
  );

  return (
    <AOCWorkspace
      courseId={courseId}
      courseName={courseResponse.data.name}
      subjectType={courseResponse.data.subject_type}
      initialAnswers={uniqueLatestAnswers}
      educationLevel={educationLevel}
      initialStudyXp={initialStudyXp}
    />
  );
}
