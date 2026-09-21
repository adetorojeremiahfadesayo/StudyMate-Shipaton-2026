import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSubjectMeta } from "@/lib/course-utils";
import WikiWorkspace from "@/components/wiki/WikiWorkspace";
import type { WikiPage } from "@/types";

export const dynamic = "force-dynamic";

type WikiPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseWikiPage({ params }: WikiPageProps) {
  const { courseId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id;
  if (!userId) {
    notFound();
  }

  const [courseResponse, materialsCountResponse, wikiPagesResponse] = await Promise.all([
    supabase
      .from("courses")
      .select("id, name, subject_type")
      .eq("id", courseId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("materials")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId)
      .eq("indexed", true),
    supabase
      .from("wiki_pages")
      .select("id, course_id, title, type, content, related_pages, source_material, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
  ]);

  if (!courseResponse.data) {
    notFound();
  }

  const subject = getSubjectMeta(courseResponse.data.subject_type);
  const indexedMaterialsCount = materialsCountResponse.error ? 0 : materialsCountResponse.count ?? 0;
  const wikiPages = (wikiPagesResponse.error ? [] : wikiPagesResponse.data ?? []) as WikiPage[];

  return (
    <WikiWorkspace
      courseId={courseId}
      courseName={courseResponse.data.name}
      subjectType={subject.label}
      pages={wikiPages}
      indexedMaterialsCount={indexedMaterialsCount}
    />
  );
}
