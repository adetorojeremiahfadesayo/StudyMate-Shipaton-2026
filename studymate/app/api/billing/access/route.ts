import { getRevenueCatAccess } from "@/lib/revenuecat-access";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";
import { getStudyPlan, meteringEnabled } from '@/lib/study-usage';

export async function POST(request: Request) {
  const auth = await getAuthenticatedRouteSupabase(request);
  if (!auth) return unauthorizedResponse();
  let access;
  try { access = meteringEnabled() ? (await getStudyPlan(auth.user.id)).access : await getRevenueCatAccess(auth.user.id); } catch { access = 'unknown'; }
  return Response.json({ access }, {
    headers: { "Cache-Control": "no-store" },
  });
}
