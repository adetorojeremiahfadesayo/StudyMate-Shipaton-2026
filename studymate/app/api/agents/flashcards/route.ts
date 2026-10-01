import { withStudyQuota } from "@/lib/metered-route";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildFlashcardPrompt, FLASHCARD_SYSTEM_PROMPT } from "@/lib/prompts";
import { getChatCompletion } from "@/lib/openai";

export const runtime = "nodejs";

const flashcardSchema = z.object({
  key_point_id: z.string().trim().min(1),
  front: z.string().trim().min(1),
  back: z.string().trim().min(1),
});

type FlashcardInput = z.infer<typeof flashcardSchema>;

function stripMarkdown(text: string) {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function condenseBack(content: string) {
  const plain = stripMarkdown(content);
  return plain.length > 850 ? `${plain.slice(0, 850).trim()}...` : plain;
}

function parseFlashcards(response: unknown): FlashcardInput[] {
  const rawItems = Array.isArray(response)
    ? response
    : Array.isArray((response as { items?: unknown })?.items)
      ? ((response as { items: unknown[] }).items ?? [])
      : [];

  return rawItems
    .map((item) => flashcardSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
}

async function handlePost(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase(request);
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user } = authenticated;
    const body = (await request.json()) as { courseId?: string };
    if (!body.courseId) {
      return NextResponse.json({ error: "Missing course ID." }, { status: 400 });
    }

    const courseId = body.courseId;

    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("id, name, user_id")
      .eq("id", courseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const { data: keyPoints, error: keyPointsError } = await supabaseAdmin
      .from("key_points")
      .select("id, title, type, content, source_material, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });

    if (keyPointsError) {
      return NextResponse.json({ error: keyPointsError.message }, { status: 500 });
    }

    if (!keyPoints || keyPoints.length === 0) {
      return NextResponse.json({ error: "Extract key points first." }, { status: 400 });
    }

    const response = await getChatCompletion<unknown>(
      buildFlashcardPrompt({
        courseName: course.name,
        keyPoints,
      }),
      FLASHCARD_SYSTEM_PROMPT,
      { modelTier: "standard", requestName: "flashcards" },
    );

    const flashcards = parseFlashcards(response);
    const flashcardPayload =
      flashcards.length > 0
        ? flashcards
        : keyPoints.map((point) => ({
            key_point_id: point.id,
            front: point.title,
            back: condenseBack(point.content),
          }));

    const { error: deleteError } = await supabaseAdmin.from("flashcards").delete().eq("course_id", courseId);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const insertPayload = flashcardPayload.map((card) => ({
      course_id: courseId,
      key_point_id: card.key_point_id,
      front: card.front,
      back: card.back,
      status: "review",
    }));

    const { data: insertedFlashcards, error: insertError } = await supabaseAdmin
      .from("flashcards")
      .insert(insertPayload)
      .select("id, course_id, key_point_id, front, back, status, created_at");

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      count: insertedFlashcards?.length ?? 0,
      flashcards: insertedFlashcards ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Flashcard generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase(request);
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user } = authenticated;
    const body = (await request.json()) as { flashcardId?: string; status?: "review" | "mastered" };
    if (!body.flashcardId || !body.status) {
      return NextResponse.json({ error: "Missing flashcard ID or status." }, { status: 400 });
    }

    const { data: flashcard, error: flashcardError } = await supabaseAdmin
      .from("flashcards")
      .select("id, course_id")
      .eq("id", body.flashcardId)
      .maybeSingle();

    if (flashcardError) {
      return NextResponse.json({ error: flashcardError.message }, { status: 500 });
    }

    if (!flashcard) {
      return NextResponse.json({ error: "Flashcard not found." }, { status: 404 });
    }

    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("id")
      .eq("id", flashcard.course_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("flashcards")
      .update({ status: body.status })
      .eq("id", body.flashcardId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Flashcard update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withStudyQuota(handlePost, "flashcards");
