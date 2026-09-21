import { notFound } from "next/navigation";
import LearnWorkspace from "@/components/learn/LearnWorkspace";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeEducationLevel } from "@/lib/learning-profile";
import type { KeyPoint, WikiPage } from "@/types";

export const dynamic = "force-dynamic";

type LearnPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseLearnPage({ params }: LearnPageProps) {
  const { courseId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id;
  if (!userId) {
    notFound();
  }

  const [courseResponse, notesResponse, keyPointsResponse, wikiResponse] = await Promise.all([
    supabase
      .from("courses")
      .select("id, name, subject_type")
      .eq("id", courseId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("notes")
      .select("id, course_id, content, generated_at, edited_at")
      .eq("course_id", courseId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("key_points")
      .select("id, course_id, type, title, content, source_material, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
    supabase
      .from("wiki_pages")
      .select("id, course_id, title, type, content, related_pages, source_material, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
  ]);

  if (!courseResponse.data) {
    notFound();
  }

  return (
    <LearnWorkspace
      courseId={courseId}
      courseName={courseResponse.data.name}
      subjectType={courseResponse.data.subject_type}
      educationLevel={normalizeEducationLevel(session?.user.user_metadata?.education_level) ?? "tertiary"}
      noteContent={notesResponse.data?.content ?? null}
      keyPoints={(keyPointsResponse.error ? [] : keyPointsResponse.data ?? []) as KeyPoint[]}
      wikiPages={(wikiResponse.error ? [] : wikiResponse.data ?? []) as WikiPage[]}
    />
  );
}
