import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from '@/lib/route-helpers';
import { meteringEnabled, operationSession, rpc, StudyError, getStudyPlan, checked } from '@/lib/study-usage';
import { supabaseAdmin } from '@/lib/supabase-admin';

export function usageError(error: unknown) {
  const messages: Record<string,string> = {
    SESSION_LIMIT: 'Your monthly sessions are used. Add a top-up or upgrade to continue. Saved work stays available.',
    COURSE_LIMIT: 'Your active course limit is reached. Archive a course or upgrade.',
    OPERATION_BUSY: 'This step is already running. Please wait before retrying.',
    OPERATION_CONFLICT: 'This step is already saved for this session. Start a new session to generate different work.',
    SESSION_RELEASED: 'The failed session was released. Start a new one; its allowance was returned.',
    SESSION_EXPIRED: 'This session has ended. Start a new session to generate more work.',
    ASSIGNMENT_INCOMPLETE: 'Complete the assigned active time and submit the practice set first.',
  };
  if (error instanceof StudyError) return Response.json({ error: messages[error.code] || error.code.replaceAll('_',' ').toLowerCase(), code: error.code }, { status: error.status });
  return Response.json({ error: 'Could not complete this action. Please retry.' }, { status: 503 });
}
export function canonicalInput(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonicalInput).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => JSON.stringify(k) + ':' + canonicalInput(v)).join(',') + '}';
  return JSON.stringify(value) ?? 'null';
}
export function withStudyQuota(handler: (request: NextRequest) => Promise<Response>, operation: string) {
  return async (request: NextRequest): Promise<Response> => {
    if (!meteringEnabled()) return handler(request);
    let sessionId: string | undefined; let token: string | undefined; let userId: string | undefined; let op = operation;
    try {
      const auth = await getAuthenticatedRouteSupabase(request);
      if (!auth) return unauthorizedResponse();
      userId = auth.user.id;
      const raw = await request.clone().text();
      if (Buffer.byteLength(raw) > 32_768) return Response.json({ error: 'Request is too large.' }, { status: 413 });
      const body = JSON.parse(raw) as Record<string, unknown>;
      if (!body || typeof body !== 'object' || Array.isArray(body)) return Response.json({ error: 'Invalid request.' }, { status: 400 });
      if (typeof body.courseId !== 'string') return Response.json({ error: 'Missing course ID.' }, { status: 400 });
      if (typeof body.topic === 'string' && body.topic.length > 300) return Response.json({ error: 'Use a topic shorter than 300 characters.' }, { status: 400 });
      const session = await operationSession(userId, body.courseId, typeof body.topic === 'string' ? body.topic.trim() : '', typeof body.studySessionId === 'string' ? body.studySessionId : undefined, request.headers.get('Idempotency-Key') || undefined);
      sessionId = session.id;
      op = operation === 'explanation' ? `explanation_${body.mode === 'story' ? 'story' : 'plain'}` : operation;
      if (operation === 'feedback' && body.retry === true) op = 'retry_feedback';
      // Stable slots bound AI calls; changing input cannot create unlimited operations inside one allowance.
      const input = { ...body }; delete input.studySessionId;
      const hash = createHash('sha256').update(canonicalInput(input)).digest('hex');
      if (session.assignment_id) {
        const saved = checked(await supabaseAdmin.from('study_operations').select('status').eq('session_id', session.id).eq('operation', op).eq('status', 'complete').maybeSingle());
        if (!saved) {
          const run = checked(await supabaseAdmin.from('school_runs').select('state,last_seen').eq('session_id', session.id).eq('user_id', userId).single());
          if (run.state !== 'active' || Date.parse(run.last_seen) < Date.now() - 45_000) throw new StudyError('Start or resume the visible assigned study timer first.', 403);
        }
      }
      const lease = await rpc<{ cached: boolean; result?: unknown; token?: string }>('study_begin_operation', { p_user: userId, p_session: sessionId, p_operation: op, p_hash: hash, p_topic: typeof body.topic === 'string' ? body.topic.trim() : '' });
      if (lease.cached) return Response.json(lease.result, { headers: { 'X-Study-Session': sessionId, 'Cache-Control': 'no-store' } });
      token = lease.token;
      if (operation === 'quiz' && Number(body.questionCount) > 3 && session.source !== 'credit' && (await getStudyPlan(userId, session.school_id || undefined)).tier === 'free') {
        await rpc('study_finish_operation', { p_user: userId, p_session: sessionId, p_operation: op, p_token: token, p_result: null, p_success: false });
        token = undefined;
        return Response.json({ error: 'Pro, school access or a top-up session is required for five questions.', code: 'PRO_REQUIRED' }, { status: 403 });
      }
      const internalRequest = new NextRequest(request.url, { method: 'POST', headers: request.headers, body: JSON.stringify({ ...body, studySessionId: session.id, studyTopic: session.topic }) });
      const response = await handler(internalRequest);
      let result = await response.clone().json();
      // Generation responses omit answer keys; grading uses the persisted rubric.
      if (['quiz','retry_quiz'].includes(operation) && response.ok) {
        const full = result as { questions: Array<Record<string, unknown>> };
        result = { ...full, questions: full.questions.map(q => ({ id: q.id, question: q.question, type: q.type, marks: q.marks, topic: q.topic, source_material: q.source_material, options: Array.isArray(q.options) ? q.options.map(o => ({ label: o.label, text: o.text })) : null })) };
      }
      await rpc('study_finish_operation', { p_user: userId, p_session: sessionId, p_operation: op, p_token: token, p_result: response.ok ? result : null, p_success: response.ok });
      token = undefined;
      return Response.json(result, { status: response.status, headers: { 'X-Study-Session': sessionId, 'Cache-Control': 'no-store' } });
    } catch (error) {
      if (sessionId && token && userId) {
        await rpc('study_finish_operation', { p_user: userId, p_session: sessionId, p_operation: op, p_token: token, p_result: null, p_success: false }).catch(() => undefined);
      }
      return usageError(error);
    }
  };
}
