import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";
import { processMaterialOcr } from "@/lib/material-ocr";

export const runtime = "nodejs";

type OcrRequestBody = {
  materialId?: string;
  fileUrl?: string;
};

export async function POST(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase();
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user, supabase } = authenticated;
    const body = (await request.json()) as OcrRequestBody;
    if (!body.materialId) {
      return NextResponse.json({ error: "Missing material ID." }, { status: 400 });
    }

    const { data: material, error: materialError } = await supabase
      .from("materials")
      .select("id, course_id")
      .eq("id", body.materialId)
      .maybeSingle();

    if (materialError) {
      return NextResponse.json({ error: materialError.message }, { status: 500 });
    }

    if (!material) {
      return NextResponse.json({ error: "Material not found." }, { status: 404 });
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", material.course_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const text = await processMaterialOcr(body.materialId, body.fileUrl);

    return NextResponse.json({
      text,
      status: "complete",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OCR failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
