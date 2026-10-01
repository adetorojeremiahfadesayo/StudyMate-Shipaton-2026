import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { DEMO_USER, IS_DEMO_MODE } from "@/lib/demo-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseRouteClient } from "@/lib/supabase-route";

export async function getAuthenticatedRouteSupabase(request?: Request): Promise<
  | { user: User; supabase: Awaited<ReturnType<typeof createSupabaseRouteClient>> }
  | null
> {
  const authorization = request?.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7).trim();
    if (!token) return null;
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    return { user: data.user, supabase: supabaseAdmin };
  }

  if (IS_DEMO_MODE) {
    return { user: DEMO_USER, supabase: supabaseAdmin };
  }

  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;

  if (error || !user) {
    return null;
  }

  return { user, supabase };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

export function badRequestResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverErrorResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function requireCourseOwnership(
  supabase: Awaited<ReturnType<typeof createSupabaseRouteClient>>,
  courseId: string,
  userId: string,
) {
  const { data: course, error } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!course) {
    throw new Error("Course not found.");
  }
}
