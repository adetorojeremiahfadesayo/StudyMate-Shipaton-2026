import { getRevenueCatAccess } from "@/lib/revenuecat-access";
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from "@/lib/route-helpers";

export async function POST(request: Request) {
  const auth = await getAuthenticatedRouteSupabase(request);
  if (!auth) return unauthorizedResponse();
  return Response.json({ access: await getRevenueCatAccess(auth.user.id) }, {
    headers: { "Cache-Control": "no-store" },
  });
}
