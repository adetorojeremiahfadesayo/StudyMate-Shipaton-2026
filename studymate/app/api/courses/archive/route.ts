import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from '@/lib/route-helpers';
import { checked, getStudyPlan } from '@/lib/study-usage';
import { usageError } from '@/lib/metered-route';
export async function POST(request: Request) {
  const auth = await getAuthenticatedRouteSupabase(request); if (!auth) return unauthorizedResponse();
  try {
    const b = z.object({ courseId: z.uuid(), archived: z.boolean() }).parse(await request.json());
    await getStudyPlan(auth.user.id);
    const row = checked(await supabaseAdmin.from('courses').update({ archived_at: b.archived ? new Date().toISOString() : null }).eq('id', b.courseId).eq('user_id', auth.user.id).select('id').maybeSingle());
    return Response.json(row ? { success: true } : { error: 'Course not found.' }, { status: row ? 200 : 404 });
  } catch (error) { if (error instanceof z.ZodError) return Response.json({ error: 'Invalid archive request.' }, { status: 400 }); return usageError(error); }
}
