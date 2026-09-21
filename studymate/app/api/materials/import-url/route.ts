import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, requireCourseOwnership, unauthorizedResponse } from "@/lib/route-helpers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { extractArticleFromUrl } from "@/lib/article-extractor";

export const runtime = "nodejs";

function isMissingOcrProgressError(errorMessage?: string) {
  return Boolean(errorMessage?.toLowerCase().includes("ocr_progress"));
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase();
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user, supabase } = authenticated;
    const body = (await request.json()) as { url?: string; courseId?: string };
    const { url, courseId } = body;

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "Missing or invalid URL." }, { status: 400 });
    }

    if (!courseId || typeof courseId !== "string" || !courseId.trim()) {
      return NextResponse.json({ error: "Missing course ID." }, { status: 400 });
    }

    // Verify course ownership
    await requireCourseOwnership(supabase, courseId, user.id);

    // Extract the article content
    let extracted: { title: string; content: string };
    try {
      extracted = await extractArticleFromUrl(url.trim());
    } catch (scrapeErr) {
      const message = scrapeErr instanceof Error ? scrapeErr.message : "Failed to scrape the URL.";
      return NextResponse.json({ error: `Scrape error: ${message}` }, { status: 400 });
    }

    const materialPayload = {
      course_id: courseId,
      file_name: `[Article] ${extracted.title}`,
      file_url: url.trim(),
      file_type: "text/markdown",
      file_size: Buffer.byteLength(extracted.content),
      storage_path: null,
      mime_type: "text/markdown",
      ocr_status: "complete",
      ocr_progress: 100,
      ocr_text: extracted.content,
      indexed: true,
    };

    let { data: material, error: insertError } = await supabaseAdmin
      .from("materials")
      .insert(materialPayload)
      .select(
        "id, course_id, file_name, file_url, file_type, file_size, storage_path, mime_type, ocr_status, ocr_progress, ocr_text, error_message, indexed, created_at",
      )
      .single();

    if (insertError && isMissingOcrProgressError(insertError.message)) {
      const fallbackPayload = {
        course_id: materialPayload.course_id,
        file_name: materialPayload.file_name,
        file_url: materialPayload.file_url,
        file_type: materialPayload.file_type,
        file_size: materialPayload.file_size,
        storage_path: materialPayload.storage_path,
        mime_type: materialPayload.mime_type,
        ocr_status: materialPayload.ocr_status,
        ocr_text: materialPayload.ocr_text,
        indexed: materialPayload.indexed,
      };

      const fallbackResult = await supabaseAdmin
        .from("materials")
        .insert(fallbackPayload)
        .select(
          "id, course_id, file_name, file_url, file_type, file_size, storage_path, mime_type, ocr_status, ocr_text, error_message, indexed, created_at",
        )
        .single();

      material = fallbackResult.data ? { ...fallbackResult.data, ocr_progress: 100 } : null;
      insertError = fallbackResult.error;
    }

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      material,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
