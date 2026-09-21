import { notFound } from "next/navigation";
import NotesWorkspace from "@/components/notes/NotesWorkspace";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { CourseNote } from "@/types";

export const dynamic = "force-dynamic";

type NotesPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseNotesPage({ params }: NotesPageProps) {
  const { courseId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id;
  if (!userId) {
    notFound();
  }

  const [courseResponse, noteResponse] = await Promise.all([
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
      .maybeSingle(),
  ]);

  if (!courseResponse.data) {
    notFound();
  }

  const note = (noteResponse.error ? null : noteResponse.data) as CourseNote | null;

  return (
    <NotesWorkspace
      courseId={courseId}
      courseName={courseResponse.data.name}
      subjectType={courseResponse.data.subject_type}
      note={note}
    />
  );
}
