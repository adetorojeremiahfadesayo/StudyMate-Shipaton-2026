import { withStudyQuota } from "@/lib/metered-route";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";
import { generateAocAnswers } from "@/lib/answer-agents";
import { normalizeEducationLevel } from "@/lib/learning-profile";

export const runtime = "nodejs";

const payloadSchema = z.object({
  courseId: z.string().min(1),
  topics: z.array(z.string().min(1)).min(1),
  mode: z.enum(["plain", "story"]).optional(),
});

async function handlePost(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase(request);
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user, supabase } = authenticated;
    const body = payloadSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const educationLevel = normalizeEducationLevel(user.user_metadata?.education_level) ?? "tertiary";
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", body.data.courseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const results = await generateAocAnswers({
      courseId: body.data.courseId,
      topics: body.data.topics,
      mode: body.data.mode ?? "plain",
      educationLevel,
    });

    return NextResponse.json({
      results,
      count: results.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AOC generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withStudyQuota(handlePost, "examanswer");
