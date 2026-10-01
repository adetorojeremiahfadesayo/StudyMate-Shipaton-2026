import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getChatCompletion } from "@/lib/openai";
import {
  buildQuizGenerationPrompt,
  buildQuizGradingPrompt,
  QUIZ_GENERATION_SYSTEM_PROMPT,
  QUIZ_GRADING_SYSTEM_PROMPT,
} from "@/lib/prompts";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { EducationLevel, QuizGrade, QuizQuestion, QuizType, SubjectType } from "@/types";

const mcqSchema = z.object({
  type: z.literal("mcq"),
  question: z.string().trim().min(1),
  options: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        text: z.string().trim().min(1),
        correct: z.boolean(),
      }),
    )
    .length(4),
  correct_answer: z.string().trim().min(1),
  explanation: z.string().trim().min(1),
  topic: z.string().trim().min(1).optional(),
  source_material: z.string().trim().min(1).optional(),
  marks: z.number().int().positive().optional(),
  key_points: z.array(z.string().trim().min(1)).optional(),
});

const essaySchema = z.object({
  type: z.literal("essay"),
  question: z.string().trim().min(1),
  model_answer: z.string().trim().min(1),
  key_points: z.array(z.string().trim().min(1)).min(1),
  marks: z.number().int().positive(),
  topic: z.string().trim().min(1).optional(),
  source_material: z.string().trim().min(1).optional(),
});

const quizQuestionSchema = z.union([mcqSchema, essaySchema]);

type WikiPageLike = {
  title: string;
  type: string;
  content: string;
  source_material?: string | null;
  created_at?: string;
};

function normalizeQuizType(quizType: string): QuizType {
  return quizType === "mcq" || quizType === "essay" || quizType === "mixed" ? quizType : "mixed";
}

function buildGrade(percentage: number): QuizGrade {
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

async function fetchCourseAndWiki(courseId: string) {
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

export async function generateQuizQuestions({
  courseId,
  quizType,
  questionCount,
  educationLevel,
  quizSessionId: suppliedSessionId,
  focus,
  topic,
}: {
  courseId: string;
  quizType: string;
  questionCount: number;
  educationLevel?: EducationLevel;
  quizSessionId?: string;
  focus?: string;
  topic?: string;
}) {
  const normalizedQuizType = normalizeQuizType(quizType);
  const { course, wikiPages } = await fetchCourseAndWiki(courseId);
  const quizSessionId = suppliedSessionId || randomUUID();
  if (suppliedSessionId) {
    const existing = await supabaseAdmin.from('quiz_questions').select('*').eq('course_id', courseId).eq('quiz_session_id', suppliedSessionId);
    if (existing.error) throw new Error(existing.error.message);
    if (existing.data?.length) return { course, quizSessionId, questions: existing.data as QuizQuestion[] };
  }
  if (!wikiPages.length) throw new Error('Prepare your material before practising.');

  const rawResponse = await getChatCompletion<unknown>(
    buildQuizGenerationPrompt({
      courseName: course.name,
      subjectType: course.subject_type,
      quizType: normalizedQuizType,
      questionCount,
      educationLevel,
      wikiPages,
    }) + (topic ? '\nKeep every question focused on this study-session topic, using only the supplied course material:\n' + topic.slice(0, 300) : '') + (focus ? '\nPrioritize a targeted retry of these observed gaps:\n' + focus.slice(0, 2000) : ''),
    QUIZ_GENERATION_SYSTEM_PROMPT,
    { modelTier: "complex", requestName: "quiz-generation" },
  );

  const parsedQuestions = Array.isArray(rawResponse)
    ? rawResponse
        .map((entry) => quizQuestionSchema.safeParse(entry))
        .filter((result) => result.success)
        .map((result) => result.data)
    : [];

  if (parsedQuestions.length === 0) {
    throw new Error("Could not generate quiz. Please try again.");
  }

  const limitedQuestions = parsedQuestions.slice(0, questionCount);
  const payload = limitedQuestions.map((question) => ({
    id: randomUUID(),
    course_id: courseId,
    quiz_session_id: quizSessionId,
    type: question.type,
    question: question.question,
    options: question.type === "mcq" ? question.options : null,
    correct_answer: question.type === "mcq" ? question.correct_answer : null,
    explanation: question.type === "mcq" ? question.explanation : null,
    model_answer: question.type === "essay" ? question.model_answer : null,
    key_points: question.type === "essay" ? question.key_points : [],
    marks: question.type === "essay" ? question.marks : 1,
    topic: question.topic ?? question.source_material ?? course.name,
    source_material: question.source_material ?? null,
  }));

  const { error: insertError } = await supabaseAdmin.from("quiz_questions").insert(payload);
  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    course,
    quizSessionId,
    questions: limitedQuestions.map((question, index) => ({
      ...question,
      id: payload[index].id,
      course_id: courseId,
      quiz_session_id: quizSessionId,
      source_material: question.source_material ?? null,
      marks: question.type === "essay" ? question.marks : 1,
      topic: question.topic ?? question.source_material ?? course.name,
    })) as QuizQuestion[],
  };
}

export async function gradeEssayAnswer({
  courseId,
  question,
  studentAnswer,
  modelAnswer,
  keyPoints,
  marks,
  educationLevel,
}: {
  courseId: string;
  question: string;
  studentAnswer: string;
  modelAnswer?: string;
  keyPoints?: string[];
  marks?: number;
  educationLevel?: EducationLevel;
}) {
  const { course, wikiPages } = await fetchCourseAndWiki(courseId);

  const rawResponse = await getChatCompletion<unknown>(
    buildQuizGradingPrompt({
      courseName: course.name,
      subjectType: course.subject_type,
      question,
      modelAnswer,
      studentAnswer,
      keyPoints,
      marks,
      educationLevel,
      wikiPages,
    }),
    QUIZ_GRADING_SYSTEM_PROMPT,
    { modelTier: "standard", requestName: "quiz-grading" },
  );

  const result = z
    .object({
      score: z.number().nonnegative(),
      max_score: z.number().positive(),
      percentage: z.number().min(0).max(100),
      grade: z.enum(["A", "B", "C", "D", "F"]),
      feedback: z.string().trim().min(1),
      strengths: z.array(z.string().trim().min(1)).default([]),
      improvements: z.array(z.string().trim().min(1)).default([]),
      key_points_covered: z.array(z.string().trim().min(1)).default([]),
      key_points_missed: z.array(z.string().trim().min(1)).default([]),
    })
    .safeParse(rawResponse);

  if (!result.success) {
    throw new Error("Could not grade essay answer.");
  }

  return result.data;
}

export async function saveQuizAttempt({
  courseId,
  quizSessionId,
  quizType,
  questionCount,
  score,
  maxScore,
  percentage,
  grade,
  feedback,
  strengths,
  improvements,
  keyPointsCovered,
  keyPointsMissed,
  questionsSnapshot,
  answersSnapshot,
  serverVerified = false,
}: {
  courseId: string;
  quizSessionId: string;
  quizType: QuizType;
  questionCount: number;
  score: number;
  maxScore: number;
  percentage: number;
  grade?: QuizGrade;
  feedback?: string | null;
  strengths?: string[];
  improvements?: string[];
  keyPointsCovered?: string[];
  keyPointsMissed?: string[];
  questionsSnapshot?: QuizQuestion[];
  answersSnapshot?: Array<Record<string, unknown>>;
  serverVerified?: boolean;
}) {
  const attemptPayload = {
    course_id: courseId,
    quiz_session_id: quizSessionId,
    quiz_type: quizType,
    question_count: questionCount,
    score,
    max_score: maxScore,
    percentage,
    grade: grade ?? buildGrade(percentage),
    feedback: feedback ?? null,
    strengths: strengths ?? [],
    improvements: improvements ?? [],
    key_points_covered: keyPointsCovered ?? [],
    key_points_missed: keyPointsMissed ?? [],
    questions_snapshot: questionsSnapshot ?? [],
    answers_snapshot: answersSnapshot ?? [],
    server_verified: serverVerified,
  };

  const { data, error } = await supabaseAdmin
    .from("quiz_attempts")
    .insert(attemptPayload)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export function deriveQuizGrade(score: number, maxScore: number) {
  if (maxScore <= 0) {
    return {
      percentage: 0,
      grade: "F" as QuizGrade,
    };
  }

  const percentage = Math.round((score / maxScore) * 100);
  return {
    percentage,
    grade: buildGrade(percentage),
  };
}
