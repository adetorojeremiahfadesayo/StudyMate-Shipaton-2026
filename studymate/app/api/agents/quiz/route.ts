import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";
import { generateQuizQuestions } from "@/lib/quiz-agent";
import { normalizeEducationLevel } from "@/lib/learning-profile";

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
      quizType?: string;
      questionCount?: number;
    };

    if (!body.courseId || !body.quizType || typeof body.questionCount !== "number") {
      return NextResponse.json({ error: "Missing course ID, quiz type, or question count." }, { status: 400 });
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
      educationLevel,
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
