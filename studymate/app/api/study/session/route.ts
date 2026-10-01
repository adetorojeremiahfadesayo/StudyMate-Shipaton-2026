import { z } from 'zod';
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from '@/lib/route-helpers';
import { reserveSession, checked } from '@/lib/study-usage';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { usageError } from '@/lib/metered-route';
const schema = z.union([z.object({ resumeId: z.uuid() }), z.object({ courseId: z.uuid(), topic: z.string().trim().max(300).default(''), requestKey: z.uuid(), assignmentId: z.uuid().optional() })]);
export async function POST(request: Request) {
  const auth = await getAuthenticatedRouteSupabase(request); if (!auth) return unauthorizedResponse();
  try {
    const body = schema.parse(await request.json());
    const session = 'resumeId' in body ? checked(await supabaseAdmin.from('study_sessions').select('*').eq('id', body.resumeId).eq('user_id', auth.user.id).maybeSingle()) : await reserveSession(auth.user.id, body.courseId, body.requestKey, body.topic, body.assignmentId);
    if (!session) return Response.json({ error: 'Session not found.' }, { status: 404 });
    const operations = checked(await supabaseAdmin.from('study_operations').select('operation,result').eq('session_id', session.id).eq('status', 'complete'));
    return Response.json({ session, operations }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { if (error instanceof z.ZodError) return Response.json({ error: 'Invalid session request.' }, { status: 400 }); return usageError(error); }
}
