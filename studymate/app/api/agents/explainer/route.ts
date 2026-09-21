import { NextRequest, NextResponse } from "next/server";
import { getChatCompletionText } from "@/lib/openai";
import { getAuthenticatedRouteSupabase, requireCourseOwnership, unauthorizedResponse } from "@/lib/route-helpers";
import { normalizeEducationLevel } from "@/lib/learning-profile";
import { retrieveStudyContext } from "@/lib/foundry-iq";
import type { AnswerMode, EducationLevel, SubjectType } from "@/types";

export const runtime = "nodejs";

const EXPLAINER_SYSTEM_PROMPT = [
  "You are StudyMate's Explainer.",
  "Explain course topics using only the Foundry IQ retrieved context and notes.",
  "Return only markdown content.",
  "Be clear, student-friendly, and exam-focused.",
  "If the material is insufficient, say what is missing before giving a cautious explanation.",
].join("\n");

function educationGuidance(level: EducationLevel) {
  if (level === "primary") {
    return "Use very simple language, short sentences, and friendly examples.";
  }

  if (level === "secondary") {
    return "Use clear school-level explanations with practical examples and exam tips.";
  }

  return "Use university-level explanation, precise terms, and strong exam-ready structure.";
}

function buildExplainerPrompt({
  courseName,
  subjectType,
  educationLevel,
  topic,
  mode,
  notes,
  wikiPages,
  usedFoundryIq,
}: {
  courseName: string;
  subjectType: SubjectType;
  educationLevel: EducationLevel;
  topic: string;
  mode: AnswerMode;
  notes?: string | null;
  wikiPages: Array<{ title: string; type: string; content: string; source_material?: string | null }>;
  usedFoundryIq: boolean;
}) {
  const wikiText = wikiPages
    .map((page, index) =>
      [
        `WIKI PAGE ${index + 1}`,
        `TITLE: ${page.title}`,
        `TYPE: ${page.type}`,
        `SOURCE_MATERIAL: ${page.source_material ?? "Unknown"}`,
        "CONTENT:",
        page.content.trim().slice(0, 6000),
        "END_WIKI_PAGE",
      ].join("\n"),
    )
    .join("\n\n");

  return [
    `Course name: ${courseName}`,
    `Subject type: ${subjectType}`,
    `Education level: ${educationLevel}`,
    `Mode: ${mode}`,
    "",
    `Student request: ${topic}`,
    "",
    `Knowledge layer: ${usedFoundryIq ? "Microsoft Foundry IQ retrieval" : "Local wiki fallback for demo/dev"}`,
    "",
    "Task:",
    "Explain the requested topic using the retrieved knowledge context below.",
    educationGuidance(educationLevel),
    mode === "story"
      ? [
          "Use this format:",
          "## Story",
          "Create a grounded real-life scenario that teaches the topic.",
          "",
          "## What happened",
          "Explain the key events, rules, formulas, cases, or concepts in the story.",
          "",
          "## What this means for exams",
          "Give the direct exam takeaway and common mistake to avoid.",
        ].join("\n")
      : [
          "Use this format:",
          "## Explanation",
          "Explain the topic directly in clear paragraphs.",
          "",
          "## Why it matters",
          "Explain why the concept matters inside this course material.",
          "",
          "Do not write a study guide, checklist, learning path, or generic advice.",
          "Do not include an exam-answer template unless the student explicitly asks for one.",
        ].join("\n"),
    "",
    "Notes:",
    notes?.trim().slice(0, 8000) || "No notes generated yet.",
    "",
    "Retrieved knowledge context:",
    wikiText || "No wiki pages provided.",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedRouteSupabase();
    if (!authenticated) {
      return unauthorizedResponse();
    }

    const { user, supabase } = authenticated;
    const body = (await request.json()) as { courseId?: string; topic?: string; mode?: AnswerMode };
    if (!body.courseId || typeof body.topic !== "string" || !body.topic.trim()) {
      return NextResponse.json({ error: "Missing course ID or topic." }, { status: 400 });
    }

    await requireCourseOwnership(supabase, body.courseId, user.id);

    const [courseResponse, notesResponse, wikiResponse] = await Promise.all([
      supabase
        .from("courses")
        .select("id, name, subject_type")
        .eq("id", body.courseId)
        .maybeSingle(),
      supabase
        .from("notes")
        .select("content")
        .eq("course_id", body.courseId)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("wiki_pages")
        .select("title, type, content, source_material")
        .eq("course_id", body.courseId)
        .order("created_at", { ascending: true }),
    ]);

    if (!courseResponse.data) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const educationLevel = normalizeEducationLevel(user.user_metadata?.education_level) ?? "tertiary";
    const foundryContext = await retrieveStudyContext({
      courseId: body.courseId,
      query: body.topic.trim(),
      wikiPages: wikiResponse.error ? [] : wikiResponse.data ?? [],
      topK: 5,
    });
    const explanation = await getChatCompletionText(
      buildExplainerPrompt({
        courseName: courseResponse.data.name,
        subjectType: courseResponse.data.subject_type,
        educationLevel,
        topic: body.topic.trim(),
        mode: body.mode === "story" ? "story" : "plain",
        notes: notesResponse.data?.content,
        wikiPages: foundryContext.pages,
        usedFoundryIq: foundryContext.usedFoundryIq,
      }),
      EXPLAINER_SYSTEM_PROMPT,
      {
        modelTier: "complex",
        temperature: body.mode === "story" ? 0.45 : 0.25,
        maxTokens: 5000,
        requestName: body.mode === "story" ? "explainer-story" : "explainer-plain",
      },
    );

    if (!explanation) {
      return NextResponse.json({ error: "No explanation was generated." }, { status: 500 });
    }

    return NextResponse.json({
      explanation,
      knowledge_layer: foundryContext.usedFoundryIq ? "foundry_iq" : "local_wiki_fallback",
      citations: foundryContext.citations,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Explanation generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
