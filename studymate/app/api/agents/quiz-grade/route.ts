import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";
import {
  deriveQuizGrade,
  gradeEssayAnswer,
  saveQuizAttempt,
} from "@/lib/quiz-agent";
import { normalizeEducationLevel } from "@/lib/learning-profile";
import type { QuizQuestion, QuizType } from "@/types";

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
      studentAnswer?: string;
      modelAnswer?: string;
      keyPoints?: string[];
      marks?: number;
      quizSessionId?: string;
      quizType?: QuizType;
      questionCount?: number;
      score?: number;
      maxScore?: number;
      percentage?: number;
      grade?: "A" | "B" | "C" | "D" | "F";
      feedback?: string;
      strengths?: string[];
      improvements?: string[];
      keyPointsCovered?: string[];
      keyPointsMissed?: string[];
      questionsSnapshot?: QuizQuestion[];
      answersSnapshot?: Array<Record<string, unknown>>;
      attemptSummary?: boolean;
    };

    if (!body.courseId) {
      return NextResponse.json({ error: "Missing course ID." }, { status: 400 });
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

    if (body.attemptSummary) {
      if (
        !body.quizSessionId ||
        !body.quizType ||
        typeof body.questionCount !== "number" ||
        typeof body.score !== "number" ||
        typeof body.maxScore !== "number" ||
        typeof body.percentage !== "number"
      ) {
        return NextResponse.json({ error: "Missing quiz attempt summary fields." }, { status: 400 });
      }

      const saved = await saveQuizAttempt({
        courseId: body.courseId,
        quizSessionId: body.quizSessionId,
        quizType: body.quizType,
        questionCount: body.questionCount,
        score: body.score,
        maxScore: body.maxScore,
        percentage: body.percentage,
        grade: body.grade,
        feedback: body.feedback ?? null,
        strengths: body.strengths,
        improvements: body.improvements,
        keyPointsCovered: body.keyPointsCovered,
        keyPointsMissed: body.keyPointsMissed,
        questionsSnapshot: body.questionsSnapshot,
        answersSnapshot: body.answersSnapshot,
      });

      return NextResponse.json({ success: true, attemptId: saved.id });
    }

    if (!body.question || typeof body.studentAnswer !== "string") {
      return NextResponse.json({ error: "Missing question or student answer." }, { status: 400 });
    }

    const grading = await gradeEssayAnswer({
      courseId: body.courseId,
      question: body.question,
      studentAnswer: body.studentAnswer,
      modelAnswer: body.modelAnswer,
      keyPoints: body.keyPoints,
      marks: body.marks,
      educationLevel,
    });

    const { percentage, grade } = deriveQuizGrade(grading.score, grading.max_score);

    return NextResponse.json({
      ...grading,
      percentage,
      grade,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Quiz grading failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
