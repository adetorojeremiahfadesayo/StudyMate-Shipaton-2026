import { withStudyQuota } from "@/lib/metered-route";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, requireCourseOwnership, unauthorizedResponse } from "@/lib/route-helpers";
import { gradeScenarioStep } from "@/lib/scenario-agent";

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
      subjectType?: string;
      scenario?: string;
      topic?: string;
      step?: "issues" | "solution" | "clinical" | "general";
      studentInput?: string;
    };

    if (
      !body.courseId ||
      !body.subjectType ||
      !body.scenario ||
      !body.topic ||
      !body.step ||
      typeof body.studentInput !== "string"
    ) {
      return NextResponse.json({ error: "Missing required grading parameters." }, { status: 400 });
    }

    await requireCourseOwnership(supabase, body.courseId, user.id);

    const result = await gradeScenarioStep({
      subjectType: body.subjectType,
      scenario: body.scenario,
      topic: body.topic,
      step: body.step,
      studentInput: body.studentInput.trim(),
    });

    return NextResponse.json({
      success: true,
      score: result.score,
      feedback: result.feedback,
      suggestedModelAnswer: result.suggestedModelAnswer,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to grade scenario step.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withStudyQuota(handlePost, "scenariofeedback");
