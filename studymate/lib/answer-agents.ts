import { getChatCompletion, getChatCompletionText } from "@/lib/openai";
import {
  AOC_SYSTEM_PROMPT,
  buildAocPrompt,
  buildGuardrailsPrompt,
  buildPastQuestionPrompt,
  GUARDRAILS_SYSTEM_PROMPT,
  PAST_QUESTION_SYSTEM_PROMPT,
} from "@/lib/prompts";
import { retrieveStudyContext } from "@/lib/foundry-iq";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { ConfidenceLevel, EducationLevel, SubjectType } from "@/types";

export type GuardrailsResult = {
  confidence: ConfidenceLevel;
  verified: boolean;
  citations_found: boolean;
  issues: string[];
  warning_message: string | null;
};

type WikiPageLike = {
  title: string;
  type: string;
  content: string;
  source_material?: string | null;
};

function parseConfidence(value: unknown): ConfidenceLevel {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildSourcePages(answer: string, wikiPages: WikiPageLike[]) {
  const normalizedAnswer = normalizeText(answer);
  const matchedTitles = wikiPages
    .map((page) => page.title)
    .filter((title) => normalizedAnswer.includes(normalizeText(title)));

  const unique = Array.from(new Set(matchedTitles));
  if (unique.length > 0) {
    return unique.slice(0, 5);
  }

  return wikiPages.slice(0, 3).map((page) => page.title);
}

async function fetchCourseAndWikiPages(courseId: string) {
  const [courseResponse, wikiResponse] = await Promise.all([
    supabaseAdmin
      .from("courses")
      .select("id, name, subject_type, user_id")
      .eq("id", courseId)
      .maybeSingle(),
    supabaseAdmin
      .from("wiki_pages")
      .select("title, type, content, source_material, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true }),
  ]);

  if (courseResponse.error) {
    throw new Error(courseResponse.error.message);
  }

  if (!courseResponse.data) {
    throw new Error("Course not found.");
  }

  if (wikiResponse.error) {
    throw new Error(wikiResponse.error.message);
  }

  return {
    course: courseResponse.data as { id: string; name: string; subject_type: SubjectType; user_id: string },
    wikiPages: (wikiResponse.data ?? []) as WikiPageLike[],
  };
}

export async function runGuardrails({
  courseId,
  answer,
  questionType,
}: {
  courseId: string;
  answer: string;
  questionType: string;
}) {
  const { course, wikiPages } = await fetchCourseAndWikiPages(courseId);
  const foundryContext = await retrieveStudyContext({
    courseId,
    query: answer,
    wikiPages,
    topK: 6,
  });

  const result = await getChatCompletion<Partial<GuardrailsResult>>(
    buildGuardrailsPrompt({
      courseName: course.name,
      questionType,
      answer,
      wikiPages: foundryContext.pages,
    }),
    GUARDRAILS_SYSTEM_PROMPT,
    { modelTier: "standard", requestName: "guardrails" },
  );

  const confidence = parseConfidence(result?.confidence);
  const verified = typeof result?.verified === "boolean" ? result.verified : confidence === "high";
  const citationsFound =
    typeof result?.citations_found === "boolean" ? result.citations_found : foundryContext.pages.length > 0;
  const issues = Array.isArray(result?.issues)
    ? result.issues.filter((issue): issue is string => typeof issue === "string")
    : [];
  const warningMessage =
    typeof result?.warning_message === "string"
      ? result.warning_message
      : confidence === "high"
        ? null
        : confidence === "medium"
          ? "Please verify this answer independently."
          : "Could not fully verify this answer.";

  return {
    confidence,
    verified,
    citationsFound,
    issues,
    warningMessage,
    wikiPages: foundryContext.pages,
    course,
  };
}

async function generatePastQuestionDraft({
  courseId,
  question,
  strict = false,
  mode = "plain",
  educationLevel,
}: {
  courseId: string;
  question: string;
  strict?: boolean;
  mode?: "plain" | "story";
  educationLevel?: EducationLevel;
}) {
  const { course, wikiPages } = await fetchCourseAndWikiPages(courseId);
  const foundryContext = await retrieveStudyContext({
    courseId,
    query: question,
    wikiPages,
    topK: 6,
  });
  const answer = await getChatCompletionText(
    buildPastQuestionPrompt({
      courseName: course.name,
      subjectType: course.subject_type,
      question,
      wikiPages: foundryContext.pages,
      strict,
      mode,
      educationLevel,
    }),
    PAST_QUESTION_SYSTEM_PROMPT,
    {
      modelTier: "complex",
      temperature: strict ? 0.2 : mode === "story" ? 0.45 : 0.3,
      maxTokens: 6000,
      requestName: mode === "story" ? "past-question-story" : "past-question",
    },
  );

  if (!answer) {
    throw new Error("No answer was generated.");
  }

  return { answer, course, wikiPages: foundryContext.pages, usedFoundryIq: foundryContext.usedFoundryIq };
}

export async function generatePastQuestionAnswer({
  courseId,
  question,
  mode = "plain",
  educationLevel,
}: {
  courseId: string;
  question: string;
  mode?: "plain" | "story";
  educationLevel?: EducationLevel;
}) {
  const firstPass = await generatePastQuestionDraft({ courseId, question, mode, educationLevel });
  const firstGuardrails = await runGuardrails({
    courseId,
    answer: firstPass.answer,
    questionType: "past_question",
  });

  let finalAnswer = firstPass.answer;
  let finalGuardrails = firstGuardrails;

  if (firstGuardrails.confidence === "low") {
    const secondPass = await generatePastQuestionDraft({
      courseId,
      question,
      strict: true,
      mode,
      educationLevel,
    });
    const secondGuardrails = await runGuardrails({
      courseId,
      answer: secondPass.answer,
      questionType: "past_question",
    });

    finalAnswer = secondPass.answer;
    finalGuardrails = secondGuardrails;
  }

  const sourcePages = buildSourcePages(finalAnswer, firstPass.wikiPages);
  const warningMessage = finalGuardrails.warningMessage ?? null;

  const { error: insertError } = await supabaseAdmin.from("past_questions").insert({
    course_id: courseId,
    question,
    answer: finalAnswer,
    confidence: finalGuardrails.confidence,
    warning_message: warningMessage,
    source_pages: sourcePages,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    answer: finalAnswer,
    confidence: finalGuardrails.confidence,
    warning_message: warningMessage,
    source_pages: sourcePages,
    verified: finalGuardrails.verified,
    citations_found: finalGuardrails.citationsFound,
    issues: finalGuardrails.issues,
    course: firstPass.course,
    knowledge_layer: firstPass.usedFoundryIq ? "foundry_iq" : "local_wiki_fallback",
  };
}

async function generateAocDraft({
  courseId,
  topic,
  strict = false,
  mode = "plain",
  educationLevel,
}: {
  courseId: string;
  topic: string;
  strict?: boolean;
  mode?: "plain" | "story";
  educationLevel?: EducationLevel;
}) {
  const { course, wikiPages } = await fetchCourseAndWikiPages(courseId);
  const foundryContext = await retrieveStudyContext({
    courseId,
    query: topic,
    wikiPages,
    topK: 6,
  });
  const answer = await getChatCompletionText(
    buildAocPrompt({
      courseName: course.name,
      subjectType: course.subject_type,
      topic,
      wikiPages: foundryContext.pages,
      mode,
      educationLevel,
    }),
    AOC_SYSTEM_PROMPT,
    {
      modelTier: "complex",
      temperature: strict ? 0.2 : mode === "story" ? 0.45 : 0.3,
      maxTokens: 6000,
      requestName: mode === "story" ? "aoc-story" : "aoc",
    },
  );

  if (!answer) {
    throw new Error("No answer was generated.");
  }

  return { answer, course, wikiPages: foundryContext.pages, usedFoundryIq: foundryContext.usedFoundryIq };
}

export async function generateAocAnswers({
  courseId,
  topics,
  mode = "plain",
  educationLevel,
}: {
  courseId: string;
  topics: string[];
  mode?: "plain" | "story";
  educationLevel?: EducationLevel;
}) {
  const uniqueTopics = Array.from(
    new Set(
      topics
        .map((topic) => topic.trim())
        .filter((topic) => topic.length > 0),
    ),
  );

  const results = await Promise.all(
    uniqueTopics.map(async (topic) => {
      const firstPass = await generateAocDraft({ courseId, topic, mode, educationLevel });
      const firstGuardrails = await runGuardrails({
        courseId,
        answer: firstPass.answer,
        questionType: "aoc",
      });

      let finalAnswer = firstPass.answer;
      let finalGuardrails = firstGuardrails;

      if (firstGuardrails.confidence === "low") {
        const secondPass = await generateAocDraft({
          courseId,
          topic,
          strict: true,
          mode,
          educationLevel,
        });
        const secondGuardrails = await runGuardrails({
          courseId,
          answer: secondPass.answer,
          questionType: "aoc",
        });

        finalAnswer = secondPass.answer;
        finalGuardrails = secondGuardrails;
      }

      const { error: insertError } = await supabaseAdmin.from("aoc_answers").insert({
        course_id: courseId,
        topic,
        answer: finalAnswer,
        confidence: finalGuardrails.confidence,
        warning_message: finalGuardrails.warningMessage,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      return {
        topic,
        answer: finalAnswer,
        confidence: finalGuardrails.confidence,
        warning_message: finalGuardrails.warningMessage,
        verified: finalGuardrails.verified,
        citations_found: finalGuardrails.citationsFound,
        issues: finalGuardrails.issues,
        knowledge_layer: firstPass.usedFoundryIq ? "foundry_iq" : "local_wiki_fallback",
      };
    }),
  );

  return results;
}
