import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getStudyPlan, meteringEnabled, checked } from '@/lib/study-usage';
import { usageError } from '@/lib/metered-route';

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase(request);
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user } = authenticated;
    if (meteringEnabled()) await getStudyPlan(user.id);

    const body = (await request.json()) as {
      name?: string;
      subjectType?: string;
      description?: string | null;
    };

    if (!body.name || !body.subjectType) {
      return NextResponse.json({ error: "Missing name or subjectType." }, { status: 400 });
    }

    const { data, error: insertError } = await supabaseAdmin
      .from("courses")
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        subject_type: body.subjectType,
        description: body.description ? body.description.trim() : null,
      })
      .select("id")
      .single();

    if (insertError) {
      if (meteringEnabled()) checked({ data: null, error: insertError });
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    if (meteringEnabled()) return usageError(error);
    const message = error instanceof Error ? error.message : "Failed to create course.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
