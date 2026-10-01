import { withStudyQuota } from "@/lib/metered-route";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, requireCourseOwnership, unauthorizedResponse } from "@/lib/route-helpers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generatePastQuestionAnswer } from "@/lib/answer-agents";
import { normalizeEducationLevel } from "@/lib/learning-profile";

export const runtime = "nodejs";

async function handlePost(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase(request);
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user, supabase } = authenticated;
    const body = (await request.json()) as { courseId?: string; question?: string; mode?: "plain" | "story" };
    if (!body.courseId || typeof body.question !== "string" || !body.question.trim()) {
      return NextResponse.json({ error: "Missing course ID or question." }, { status: 400 });
    }

    await requireCourseOwnership(supabase, body.courseId, user.id);

    const educationLevel = normalizeEducationLevel(user.user_metadata?.education_level) ?? "tertiary";
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", body.courseId)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const result = await generatePastQuestionAnswer({
      courseId: body.courseId,
      question: body.question.trim(),
      mode: body.mode === "story" ? "story" : "plain",
      educationLevel,
    });

    return NextResponse.json({
      answer: result.answer,
      confidence: result.confidence,
      warning_message: result.warning_message,
      source_pages: result.source_pages,
      knowledge_layer: result.knowledge_layer,
      verified: result.verified,
      citations_found: result.citations_found,
      issues: result.issues,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Past question generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase(request);
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user, supabase } = authenticated;
    const body = (await request.json()) as { courseId?: string; questionId?: string };
    if (!body.courseId || !body.questionId) {
      return NextResponse.json({ error: "Missing course ID or question ID." }, { status: 400 });
    }

    await requireCourseOwnership(supabase, body.courseId, user.id);

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", body.courseId)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const { data: question, error: questionError } = await supabaseAdmin
      .from("past_questions")
      .select("id, course_id")
      .eq("id", body.questionId)
      .eq("course_id", body.courseId)
      .maybeSingle();

    if (questionError) {
      return NextResponse.json({ error: questionError.message }, { status: 500 });
    }

    if (!question) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("past_questions")
      .delete()
      .eq("id", body.questionId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "History delete failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withStudyQuota(handlePost, "pastquestion");
