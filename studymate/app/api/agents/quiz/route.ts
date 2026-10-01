import { withStudyQuota } from "@/lib/metered-route";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";
import { generateQuizQuestions } from "@/lib/quiz-agent";
import { normalizeEducationLevel } from "@/lib/learning-profile";
import { meteringEnabled } from "@/lib/study-usage";
import { hasRevenueCatPro } from "@/lib/revenuecat-access";

export const runtime = "nodejs";

async function handlePost(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase(request);
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user, supabase } = authenticated;
    const body = (await request.json()) as {
      courseId?: string;
      quizType?: string;
      questionCount?: number;
      studySessionId?: string;
      studyTopic?: string;
    };

    if (!body.courseId || !body.quizType || typeof body.questionCount !== "number") {
      return NextResponse.json({ error: "Missing course ID, quiz type, or question count." }, { status: 400 });
    }

    if (!Number.isInteger(body.questionCount) || body.questionCount < 1 || body.questionCount > 5) {
      return NextResponse.json({ error: "Question count must be between 1 and 5." }, { status: 400 });
    }
    if (!meteringEnabled() && body.questionCount > 3 && !(await hasRevenueCatPro(user.id))) {
      return NextResponse.json({ error: "StudyMate Pro is required for a five-question set.", code: "PRO_REQUIRED" }, { status: 403 });
    }

    const educationLevel = normalizeEducationLevel(user.user_metadata?.education_level) ?? "tertiary";
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

    const result = await generateQuizQuestions({
      courseId: body.courseId,
      quizType: body.quizType,
      questionCount: body.questionCount,
      quizSessionId: body.studySessionId,
      educationLevel,
      topic: meteringEnabled() ? body.studyTopic : undefined,
    });

    return NextResponse.json({
      quizSessionId: result.quizSessionId,
      questions: result.questions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate quiz. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withStudyQuota(handlePost, "quiz");
