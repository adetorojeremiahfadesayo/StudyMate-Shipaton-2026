import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";
import { buildNotesForCourse, generateCourseNotes } from "@/lib/notes-agent";
import type { SubjectType } from "@/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase();
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user, supabase } = authenticated;
    const body = (await request.json()) as { courseId?: string; skipProfiling?: boolean };
    if (!body.courseId) {
      return NextResponse.json({ error: "Missing course ID." }, { status: 400 });
    }

    const courseId = body.courseId;
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    if (body.skipProfiling) {
      const { data: courseRecord, error: courseRecordError } = await supabase
        .from("courses")
        .select("subject_type")
        .eq("id", courseId)
        .maybeSingle();

      if (courseRecordError) {
        return NextResponse.json({ error: courseRecordError.message }, { status: 500 });
      }

      const subjectType = (courseRecord?.subject_type as SubjectType | undefined) ?? "other";
      const result = await buildNotesForCourse(courseId, subjectType);

      return NextResponse.json({
        noteId: result.noteId,
        content: result.notesMarkdown,
      });
    }

    const result = await generateCourseNotes(courseId);
    return NextResponse.json({
      noteId: result.noteId,
      content: result.notesMarkdown,
      subject_type: result.profile.subject_type,
      confidence: result.profile.confidence,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notes generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase();
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user, supabase } = authenticated;
    const body = (await request.json()) as { noteId?: string; content?: string };
    if (!body.noteId || typeof body.content !== "string") {
      return NextResponse.json({ error: "Missing note ID or content." }, { status: 400 });
    }

    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id, course_id")
      .eq("id", body.noteId)
      .maybeSingle();

    if (noteError) {
      return NextResponse.json({ error: noteError.message }, { status: 500 });
    }

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", note.course_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("notes")
      .update({
        content: body.content,
        edited_at: new Date().toISOString(),
      })
      .eq("id", body.noteId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Note update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
