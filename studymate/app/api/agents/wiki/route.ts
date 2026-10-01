import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildWikiPrompt, WIKI_SYSTEM_PROMPT } from "@/lib/prompts";
import { getChatCompletion } from "@/lib/openai";
import type { SubjectType } from "@/types";

export const runtime = "nodejs";

const wikiPageSchema = z.object({
  title: z.string().trim().min(1),
  type: z.enum(["principle", "case", "formula", "maxim", "definition", "concept"]),
  content: z.string().trim().min(1),
  related_pages: z.array(z.string().trim()).default([]),
  source_material: z.string().trim().min(1),
});

type WikiPageInput = z.infer<typeof wikiPageSchema>;

function isMissingWikiTableError(errorMessage?: string | null) {
  const message = errorMessage?.toLowerCase() ?? "";
  return message.includes("wiki_pages") || message.includes("relation");
}

function truncateForPrompt(text: string, limit = 12000) {
  const trimmed = text.trim();
  return trimmed.length > limit ? `${trimmed.slice(0, limit)}\n\n[TRUNCATED]` : trimmed;
}

function normalizeWikiResponse(response: unknown): WikiPageInput[] {
  const rawPages = Array.isArray(response)
    ? response
    : Array.isArray((response as { pages?: unknown })?.pages)
      ? ((response as { pages: unknown[] }).pages ?? [])
      : [];

  return rawPages
    .map((page) => wikiPageSchema.safeParse(page))
    .filter((result) => result.success)
    .map((result) => result.data);
}

export async function POST(request: NextRequest) {
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

    const [courseResponse, materialsResponse] = await Promise.all([
      supabaseAdmin
        .from("courses")
        .select("id, name, subject_type, user_id")
        .eq("id", body.courseId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabaseAdmin
        .from("materials")
        .select("id, file_name, ocr_text, indexed, created_at")
        .eq("course_id", body.courseId)
        .eq("indexed", true)
        .not("ocr_text", "is", null)
        .order("created_at", { ascending: true }),
    ]);

    if (courseResponse.error) {
      return NextResponse.json({ error: courseResponse.error.message }, { status: 500 });
    }

    if (!courseResponse.data) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    if (materialsResponse.error) {
      return NextResponse.json({ error: materialsResponse.error.message }, { status: 500 });
    }

    const materials = materialsResponse.data ?? [];
    if (materials.length === 0) {
      return NextResponse.json(
        { error: "No indexed materials yet. Wait for OCR to finish first." },
        { status: 400 },
      );
    }

    const prompt = buildWikiPrompt({
      courseName: courseResponse.data.name,
      subjectType: courseResponse.data.subject_type as SubjectType,
      materials: materials.map((material) => ({
        fileName: material.file_name,
        text: truncateForPrompt(material.ocr_text ?? ""),
      })),
    });

    const response = await getChatCompletion<unknown>(prompt, WIKI_SYSTEM_PROMPT, {
      modelTier: "complex",
      requestName: "wiki",
    });
    const wikiPages = normalizeWikiResponse(response);

    if (wikiPages.length === 0) {
      return NextResponse.json({
        error: "Could not prepare learning from this material. Please retry.",
      }, { status: 503 });
    }

    const { data: existingPages, error: existingPagesError } = await supabaseAdmin
      .from("wiki_pages")
      .select("id, course_id, title, type, content, related_pages, source_material, created_at")
      .eq("course_id", body.courseId);

    if (existingPagesError && isMissingWikiTableError(existingPagesError.message)) {
      return NextResponse.json(
        { error: "The wiki_pages table is missing. Run the wiki migration first." },
        { status: 500 },
      );
    }

    if (existingPagesError) {
      return NextResponse.json({ error: existingPagesError.message }, { status: 500 });
    }

    const { error: deleteError } = await supabaseAdmin.from("wiki_pages").delete().eq("course_id", body.courseId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const insertPayload = wikiPages.map((page) => ({
      course_id: body.courseId,
      title: page.title,
      type: page.type,
      content: page.content,
      related_pages: page.related_pages,
      source_material: page.source_material,
    }));

    const { data: insertedPages, error: insertError } = await supabaseAdmin
      .from("wiki_pages")
      .insert(insertPayload)
      .select("id");

    if (insertError) {
      if (existingPages && existingPages.length > 0) {
        await supabaseAdmin.from("wiki_pages").insert(existingPages);
      }

      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      pagesCreated: insertedPages?.length ?? insertPayload.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wiki build failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
