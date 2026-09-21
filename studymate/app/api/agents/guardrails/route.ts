import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";
import { runGuardrails } from "@/lib/answer-agents";

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
      answer?: string;
      questionType?: string;
    };

    if (!body.courseId || typeof body.answer !== "string" || !body.questionType) {
      return NextResponse.json(
        { error: "Missing course ID, answer, or question type." },
        { status: 400 },
      );
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", body.courseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const result = await runGuardrails({
      courseId: body.courseId,
      answer: body.answer,
      questionType: body.questionType,
    });

    return NextResponse.json({
      confidence: result.confidence,
      verified: result.verified,
      citations_found: result.citationsFound,
      issues: result.issues,
      warning_message: result.warningMessage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Guardrails verification failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
