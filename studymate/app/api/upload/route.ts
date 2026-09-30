import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, requireCourseOwnership, unauthorizedResponse } from "@/lib/route-helpers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { scheduleMaterialProcessing } from "@/lib/material-job-worker";

export const runtime = "nodejs";

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

function isMissingOcrProgressError(errorMessage?: string) {
  return Boolean(errorMessage?.toLowerCase().includes("ocr_progress"));
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase(request);
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user, supabase } = authenticated;
    const formData = await request.formData();
    const file = formData.get("file");
    const courseId = formData.get("courseId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    if (typeof courseId !== "string" || !courseId.trim()) {
      return NextResponse.json({ error: "Missing course ID." }, { status: 400 });
    }

    await requireCourseOwnership(supabase, courseId, user.id);

    const bucket = "materials";
    const fileName = sanitizeFileName(file.name || "upload-file");
    const storagePath = `${user.id}/${courseId}/${randomUUID()}-${fileName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(storagePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(storagePath, 60 * 60 * 24);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json({ error: signedUrlError?.message ?? "Could not create file URL." }, { status: 500 });
    }

    const materialPayload = {
      course_id: courseId,
      file_name: file.name,
      file_url: signedUrlData.signedUrl,
      file_type: file.type || "application/octet-stream",
      file_size: file.size,
      storage_path: storagePath,
      mime_type: file.type || null,
      ocr_status: "queued",
      ocr_progress: 0,
      indexed: false,
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
        indexed: materialPayload.indexed,
      };
      const fallbackResult = await supabaseAdmin
        .from("materials")
        .insert(fallbackPayload)
        .select(
          "id, course_id, file_name, file_url, file_type, file_size, storage_path, mime_type, ocr_status, ocr_text, error_message, indexed, created_at",
        )
        .single();

      material = fallbackResult.data ? { ...fallbackResult.data, ocr_progress: 0 } : null;
      insertError = fallbackResult.error;
    }

    if (insertError) {
      await supabaseAdmin.storage.from(bucket).remove([storagePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (material?.id) {
      void scheduleMaterialProcessing({
        materialId: material.id,
        courseId,
        userId: user.id,
      }).catch((error) => {
        console.error("Failed to schedule material processing:", error);
      });
    }

    return NextResponse.json({
      material: {
        ...material,
        fileUrl: signedUrlData.signedUrl,
      },
      fileUrl: signedUrlData.signedUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase();
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user, supabase } = authenticated;
    const { materialId } = (await request.json()) as { materialId?: string };

    if (!materialId) {
      return NextResponse.json({ error: "Missing material ID." }, { status: 400 });
    }

    const { data: material, error: materialError } = await supabaseAdmin
      .from("materials")
      .select("id, course_id, storage_path")
      .eq("id", materialId)
      .maybeSingle();

    if (materialError) {
      return NextResponse.json({ error: materialError.message }, { status: 500 });
    }

    if (!material) {
      return NextResponse.json({ error: "Material not found." }, { status: 404 });
    }

    await requireCourseOwnership(supabase, material.course_id, user.id);

    if (material.storage_path) {
      const { error: removeError } = await supabaseAdmin.storage.from("materials").remove([material.storage_path]);
      if (removeError) {
        return NextResponse.json({ error: removeError.message }, { status: 500 });
      }
    }

    const { error: deleteError } = await supabaseAdmin.from("materials").delete().eq("id", materialId);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
