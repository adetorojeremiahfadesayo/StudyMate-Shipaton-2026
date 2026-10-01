import { z } from 'zod';
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from '@/lib/route-helpers';
import { rpc } from '@/lib/study-usage';
import { usageError } from '@/lib/metered-route';
export async function POST(request: Request) {
  const auth = await getAuthenticatedRouteSupabase(request); if (!auth) return unauthorizedResponse();
  try {
    const b = z.object({ studySessionId: z.uuid(), sequence: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), action: z.enum(['heartbeat','pause','finish']), reason: z.string().trim().max(200).optional() }).parse(await request.json());
    const activity = await rpc('school_timer_event', { p_user: auth.user.id, p_session: b.studySessionId, p_sequence: b.sequence, p_action: b.action, p_reason: b.reason || null });
    return Response.json(activity);
  } catch (error) { if (error instanceof z.ZodError) return Response.json({ error: 'Invalid timer action.' }, { status: 400 }); return usageError(error); }
}
