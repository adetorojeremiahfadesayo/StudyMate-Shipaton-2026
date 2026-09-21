import { getChatCompletionText } from "@/lib/openai";
import {
  buildNotesPrompt,
  buildProfilingPrompt,
  NOTES_SYSTEM_PROMPT,
  PROFILING_SYSTEM_PROMPT,
} from "@/lib/prompts";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { SubjectType } from "@/types";

export type ProfileResult = {
  subject_type: SubjectType;
  confidence: number;
  reasoning: string;
};

function parseSubjectType(value: unknown): SubjectType {
  return value === "law" ||
    value === "engineering" ||
    value === "medicine" ||
    value === "economics"
    ? value
    : "other";
}

function clampConfidence(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

export async function detectCourseSubject(courseId: string) {
  const { data: course, error: courseError } = await supabaseAdmin
    .from("courses")
    .select("id, name, subject_type")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError) {
    throw new Error(courseError.message);
  }

  if (!course) {
    throw new Error("Course not found.");
  }

  const { data: wikiPages, error: wikiError } = await supabaseAdmin
    .from("wiki_pages")
    .select("title, content, type, source_material, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  if (wikiError) {
    throw new Error(wikiError.message);
  }

  const sampleText = (wikiPages ?? [])
    .map((page) => `TITLE: ${page.title}\nTYPE: ${page.type}\nCONTENT:\n${page.content}`)
    .join("\n\n")
    .slice(0, 2000);

  const rawResponse = await getChatCompletionText(
    buildProfilingPrompt({
      courseName: course.name,
      sampleText: sampleText || "No wiki content available.",
    }),
    PROFILING_SYSTEM_PROMPT,
    { modelTier: "light", temperature: 0.2, maxTokens: 600, requestName: "profiling" },
  );

  let parsed: ProfileResult | null = null;

  if (rawResponse) {
    try {
      const cleaned = rawResponse.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
      const json = JSON.parse(cleaned) as Partial<ProfileResult>;
      parsed = {
        subject_type: parseSubjectType(json.subject_type),
        confidence: clampConfidence(json.confidence),
        reasoning: typeof json.reasoning === "string" ? json.reasoning : "Detected from wiki sample.",
      };
    } catch {
      parsed = null;
    }
  }

  const detected = parsed ?? {
    subject_type: course.subject_type as SubjectType,
    confidence: 0,
    reasoning: "Could not parse profiling response.",
  };

  if (detected.subject_type !== course.subject_type) {
    const { error: updateError } = await supabaseAdmin
      .from("courses")
      .update({ subject_type: detected.subject_type })
      .eq("id", courseId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  return {
    course,
    profile: detected,
  };
}

export async function buildNotesForCourse(courseId: string, subjectType: SubjectType | string) {
  const { data: course, error: courseError } = await supabaseAdmin
    .from("courses")
    .select("id, name, subject_type")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError) {
    throw new Error(courseError.message);
  }

  if (!course) {
    throw new Error("Course not found.");
  }

  const { data: wikiPages, error: wikiError } = await supabaseAdmin
    .from("wiki_pages")
    .select("title, type, content, related_pages, source_material, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  if (wikiError) {
    throw new Error(wikiError.message);
  }

  const notesMarkdown = await getChatCompletionText(
    buildNotesPrompt({
      courseName: course.name,
      subjectType: subjectType as SubjectType,
      wikiPages: wikiPages ?? [],
    }),
    NOTES_SYSTEM_PROMPT,
    { modelTier: "complex", temperature: 0.3, maxTokens: 6000, requestName: "notes" },
  );

  if (!notesMarkdown) {
    throw new Error("No notes content was returned.");
  }

  const existingNotes = await supabaseAdmin
    .from("notes")
    .select("id")
    .eq("course_id", courseId)
    .maybeSingle();

  if (existingNotes.error) {
    throw new Error(existingNotes.error.message);
  }

  if (existingNotes.data) {
    const { error: updateError } = await supabaseAdmin
      .from("notes")
      .update({
        content: notesMarkdown,
        edited_at: new Date().toISOString(),
      })
      .eq("id", existingNotes.data.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return {
      course,
      noteId: existingNotes.data.id,
      notesMarkdown,
      wikiPages: wikiPages ?? [],
    };
  }

  const { data: insertedNote, error: insertError } = await supabaseAdmin
    .from("notes")
    .insert({
      course_id: courseId,
      content: notesMarkdown,
      generated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    course,
    noteId: insertedNote.id,
    notesMarkdown,
    wikiPages: wikiPages ?? [],
  };
}

export async function generateCourseNotes(courseId: string) {
  const { profile } = await detectCourseSubject(courseId);
  const result = await buildNotesForCourse(courseId, profile.subject_type as SubjectType);

  return {
    profile,
    ...result,
  };
}
