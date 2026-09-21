import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, requireCourseOwnership, unauthorizedResponse } from "@/lib/route-helpers";
import { generateScenario } from "@/lib/scenario-agent";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase();
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user, supabase } = authenticated;
    const body = (await request.json()) as { courseId?: string; topic?: string };

    if (!body.courseId) {
      return NextResponse.json({ error: "Missing course ID." }, { status: 400 });
    }

    // Fetch course to get subject type
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, subject_type")
      .eq("id", body.courseId)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    await requireCourseOwnership(supabase, body.courseId, user.id);

    const result = await generateScenario(body.courseId, course.subject_type, body.topic);

    return NextResponse.json({
      success: true,
      topic: result.topic,
      scenario: result.scenario,
      subjectType: course.subject_type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate scenario.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
