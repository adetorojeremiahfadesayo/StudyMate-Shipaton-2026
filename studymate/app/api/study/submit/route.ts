import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from '@/lib/route-helpers';
import { gradeEssayAnswer, deriveQuizGrade, saveQuizAttempt } from '@/lib/quiz-agent';
import { withStudyQuota } from '@/lib/metered-route';
import { checked } from '@/lib/study-usage';
import { normalizeEducationLevel } from '@/lib/learning-profile';
import type { QuizQuestion } from '@/types';
import { retryQuizId } from '@/lib/retry-id';
const schema = z.object({ courseId: z.uuid(), studySessionId: z.uuid(), retry: z.boolean().default(false), answers: z.array(z.object({ questionId: z.uuid(), answer: z.string().trim().min(1).max(3000) })).min(1).max(5) });
async function submit(request: NextRequest) {
  const auth = await getAuthenticatedRouteSupabase(request); if (!auth) return unauthorizedResponse();
  try {
    const body = schema.parse(await request.json());
    const owner = checked(await supabaseAdmin.from('courses').select('id').eq('id', body.courseId).eq('user_id', auth.user.id).maybeSingle());
    if (!owner) return Response.json({ error: 'Course not found.' }, { status: 404 });
    const quizId = body.retry ? retryQuizId(body.studySessionId) : body.studySessionId;
    const questions = checked(await supabaseAdmin.from('quiz_questions').select('*').eq('course_id', body.courseId).eq('quiz_session_id', quizId)) as QuizQuestion[];
    if (!questions.length || questions.length !== body.answers.length || new Set(body.answers.map(a => a.questionId)).size !== questions.length || body.answers.some(a => !questions.some(q => q.id === a.questionId))) return Response.json({ error: 'Answer every question in this saved set.' }, { status: 400 });
    const previous = checked(await supabaseAdmin.from('quiz_attempts').select('id,score,max_score,percentage,feedback').eq('course_id', body.courseId).eq('quiz_session_id', quizId).eq('server_verified', true).maybeSingle());
    if (previous) return Response.json({ attemptId: previous.id, score: previous.score, maxScore: previous.max_score, percentage: previous.percentage, questionCount: questions.length, feedback: previous.feedback });
    const level = normalizeEducationLevel(auth.user.user_metadata?.education_level) || 'tertiary';
    const results = [];
    for (const q of questions) {
      const answer = body.answers.find(a => a.questionId === q.id)!.answer;
      if (q.type === 'mcq') {
        const correct = answer.toLowerCase() === q.correct_answer?.trim().toLowerCase();
        results.push({ questionId: q.id, answer, score: correct ? 1 : 0, maxScore: 1, feedback: q.explanation || 'Compare your answer with the source.', referenceAnswer: q.correct_answer, strengths: [], improvements: [] });
      } else {
        const result = await gradeEssayAnswer({ courseId: body.courseId, question: q.question, studentAnswer: answer, modelAnswer: q.model_answer || undefined, keyPoints: q.key_points, marks: q.marks, educationLevel: level });
        // Clamp provider feedback to the persisted rubric; client scores and rubrics are never trusted.
        const maxScore = Math.max(1, q.marks || 1);
        results.push({ questionId: q.id, answer, score: Math.min(maxScore, Math.max(0, result.score)), maxScore, feedback: result.feedback, referenceAnswer: q.model_answer, strengths: result.strengths, improvements: result.improvements });
      }
    }
    const score = results.reduce((sum, r) => sum + r.score, 0), maxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
    const grading = deriveQuizGrade(score, maxScore);
    const feedback = results.map((r,i) => `Question ${i+1}: ${r.feedback}`).join('\n\n');
    const attempt = await saveQuizAttempt({ courseId: body.courseId, quizSessionId: quizId, quizType: 'mixed', questionCount: questions.length, score, maxScore, ...grading, feedback, questionsSnapshot: questions, answersSnapshot: results, strengths: results.flatMap(r => r.strengths), improvements: results.flatMap(r => r.improvements), serverVerified: true });
    return Response.json({ attemptId: attempt.id, score, maxScore, ...grading, questionCount: questions.length, feedback, answers: results });
  } catch (error) { if (error instanceof z.ZodError) return Response.json({ error: 'Check your answers.' }, { status: 400 }); return Response.json({ error: 'Feedback could not be saved. Please retry.' }, { status: 503 }); }
}
export const POST = withStudyQuota(submit, 'feedback');
