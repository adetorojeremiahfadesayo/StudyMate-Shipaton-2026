import { withStudyQuota } from "@/lib/metered-route";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildKeyPointsPrompt, KEY_POINTS_SYSTEM_PROMPT } from "@/lib/prompts";
import { getChatCompletion } from "@/lib/openai";
import { normalizeEducationLevel } from "@/lib/learning-profile";
import type { SubjectType } from "@/types";

export const runtime = "nodejs";

const keyPointSchema = z.object({
  type: z.enum(["principle", "case", "formula", "maxim", "definition", "concept"]),
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  source_material: z.string().trim().min(1),
});

type KeyPointInput = z.infer<typeof keyPointSchema>;

function parseKeyPoints(response: unknown): KeyPointInput[] {
  const rawItems = Array.isArray(response)
    ? response
    : Array.isArray((response as { items?: unknown })?.items)
      ? ((response as { items: unknown[] }).items ?? [])
      : [];

  return rawItems
    .map((item) => keyPointSchema.safeParse(item))
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
      .select("id, name, subject_type, user_id")
      .eq("id", courseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const educationLevel = normalizeEducationLevel(user.user_metadata?.education_level) ?? "tertiary";

    const { data: wikiPages, error: wikiError } = await supabaseAdmin
      .from("wiki_pages")
      .select("title, type, content, source_material, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });

    if (wikiError) {
      return NextResponse.json({ error: wikiError.message }, { status: 500 });
    }

    if (!wikiPages || wikiPages.length === 0) {
      return NextResponse.json({ error: "Build your wiki first." }, { status: 400 });
    }

    const response = await getChatCompletion<unknown>(
      buildKeyPointsPrompt({
        courseName: course.name,
        subjectType: course.subject_type as SubjectType,
        wikiPages,
        educationLevel,
      }),
      KEY_POINTS_SYSTEM_PROMPT,
      { modelTier: "complex", requestName: "key-points" },
    );

    const keyPoints = parseKeyPoints(response);
    if (keyPoints.length === 0) {
      return NextResponse.json({ error: "No key points were generated." }, { status: 500 });
    }

    const { error: deleteError } = await supabaseAdmin.from("key_points").delete().eq("course_id", courseId);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const insertPayload = keyPoints.map((point) => ({
      course_id: courseId,
      type: point.type,
      title: point.title,
      content: point.content,
      source_material: point.source_material,
    }));

    const { data: insertedKeyPoints, error: insertError } = await supabaseAdmin
      .from("key_points")
      .insert(insertPayload)
      .select("id, course_id, type, title, content, source_material, created_at");

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      keyPoints: insertedKeyPoints ?? [],
      count: insertedKeyPoints?.length ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Key points extraction failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withStudyQuota(handlePost, "keypoints");
