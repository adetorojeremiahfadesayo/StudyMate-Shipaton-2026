import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from '@/lib/route-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checked } from '@/lib/study-usage';
import { generateQuizQuestions } from '@/lib/quiz-agent';
import { withStudyQuota } from '@/lib/metered-route';
import { retryQuizId } from '@/lib/retry-id';
async function retry(request: NextRequest) {
  const auth = await getAuthenticatedRouteSupabase(request); if (!auth) return unauthorizedResponse();
  try {
    const body = z.object({ courseId: z.uuid(), studySessionId: z.uuid() }).parse(await request.json());
    const attempt = checked(await supabaseAdmin.from('quiz_attempts').select('improvements').eq('course_id', body.courseId).eq('quiz_session_id', body.studySessionId).eq('server_verified', true).maybeSingle());
    if (!attempt) return Response.json({ error: 'Submit your first practice set before retrying.' }, { status: 409 });
    const session = checked(await supabaseAdmin.from('study_sessions').select('topic').eq('id', body.studySessionId).eq('user_id', auth.user.id).single());
    const result = await generateQuizQuestions({ courseId: body.courseId, quizSessionId: retryQuizId(body.studySessionId), quizType: 'mixed', questionCount: 3, topic: session.topic, focus: attempt.improvements.join('\n') || 'Apply the same course concepts to a fresh scenario.' });
    return Response.json({ quizSessionId: result.quizSessionId, questions: result.questions });
  } catch { return Response.json({ error: 'The retry could not be prepared.' }, { status: 503 }); }
}
export const POST = withStudyQuota(retry, 'retry_quiz');
