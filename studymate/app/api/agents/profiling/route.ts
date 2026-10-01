import { withStudyQuota } from "@/lib/metered-route";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";
import { detectCourseSubject } from "@/lib/notes-agent";

export const runtime = "nodejs";

async function handlePost(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase(request);
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user, supabase } = authenticated;
    const body = (await request.json()) as { courseId?: string };
    if (!body.courseId) {
      return NextResponse.json({ error: "Missing course ID." }, { status: 400 });
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

    const { profile } = await detectCourseSubject(body.courseId);

    return NextResponse.json({
      subject_type: profile.subject_type,
      confidence: profile.confidence,
      reasoning: profile.reasoning,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profiling failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withStudyQuota(handlePost, "profiling");
