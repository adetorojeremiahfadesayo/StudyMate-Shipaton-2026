import { getAuthenticatedRouteSupabase, unauthorizedResponse } from '@/lib/route-helpers';
import { usageSummary } from '@/lib/study-usage';
import { usageError } from '@/lib/metered-route';
export async function POST(request: Request) {
  const auth = await getAuthenticatedRouteSupabase(request); if (!auth) return unauthorizedResponse();
  try { return Response.json(await usageSummary(auth.user.id), { headers: { 'Cache-Control': 'no-store' } }); } catch (error) { return usageError(error); }
}
