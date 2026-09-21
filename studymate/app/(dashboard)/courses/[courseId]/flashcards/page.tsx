import { notFound } from "next/navigation";
import FlashcardsWorkspace from "@/components/flashcards/FlashcardsWorkspace";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Flashcard, KeyPoint } from "@/types";

export const dynamic = "force-dynamic";

type FlashcardsPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseFlashcardsPage({ params }: FlashcardsPageProps) {
  const { courseId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id;
  if (!userId) {
    notFound();
  }

  const [courseResponse, keyPointsResponse, flashcardsResponse] = await Promise.all([
    supabase
      .from("courses")
      .select("id, name, subject_type")
      .eq("id", courseId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("key_points")
      .select("id, type")
      .eq("course_id", courseId),
    supabase
      .from("flashcards")
      .select("id, course_id, key_point_id, front, back, status, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true }),
  ]);

  if (!courseResponse.data) {
    notFound();
  }

  const keyPointTypeMap = new Map(
    ((keyPointsResponse.error ? [] : keyPointsResponse.data ?? []) as KeyPoint[]).map((point) => [
      point.id,
      point.type,
    ]),
  );

  const flashcards = (flashcardsResponse.error ? [] : flashcardsResponse.data ?? []).map((card) => ({
    ...card,
    key_point_type: keyPointTypeMap.get(card.key_point_id),
  })) as Flashcard[];

  const keyPointsCount = keyPointsResponse.error ? 0 : keyPointsResponse.data?.length ?? 0;
  const cardsKey = flashcards.map((card) => `${card.id}:${card.status}`).join("|");

  return (
    <FlashcardsWorkspace
      key={cardsKey}
      courseId={courseId}
      courseName={courseResponse.data.name}
      subjectType={courseResponse.data.subject_type}
      keyPointsCount={keyPointsCount}
      initialCards={flashcards}
    />
  );
}
