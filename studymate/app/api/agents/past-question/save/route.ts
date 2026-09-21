import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, requireCourseOwnership, unauthorizedResponse } from "@/lib/route-helpers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase();
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user, supabase } = authenticated;
    const body = (await request.json()) as {
      courseId?: string;
      question?: string;
      answer?: string;
      confidence?: string;
    };

    if (!body.courseId || !body.question || !body.answer) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    await requireCourseOwnership(supabase, body.courseId, user.id);

    const { data: material, error } = await supabaseAdmin
      .from("past_questions")
      .insert({
        course_id: body.courseId,
        question: body.question,
        answer: body.answer,
        confidence: body.confidence || "medium",
        warning_message: "Interactive scenario attempt",
        source_pages: [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, material });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save attempt.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
