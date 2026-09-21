import { notFound } from "next/navigation";
import KeyPointsWorkspace from "@/components/key-points/KeyPointsWorkspace";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { KeyPoint } from "@/types";

export const dynamic = "force-dynamic";

type KeyPointsPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseKeyPointsPage({ params }: KeyPointsPageProps) {
  const { courseId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id;
  if (!userId) {
    notFound();
  }

  const [courseResponse, keyPointsResponse] = await Promise.all([
    supabase
      .from("courses")
      .select("id, name, subject_type")
      .eq("id", courseId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("key_points")
      .select("id, course_id, type, title, content, source_material, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
  ]);

  if (!courseResponse.data) {
    notFound();
  }

  const keyPoints = (keyPointsResponse.error ? [] : keyPointsResponse.data ?? []) as KeyPoint[];

  return (
    <KeyPointsWorkspace
      courseId={courseId}
      subjectType={courseResponse.data.subject_type}
      points={keyPoints}
    />
  );
}
