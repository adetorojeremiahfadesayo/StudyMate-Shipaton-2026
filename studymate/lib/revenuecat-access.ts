/** Server-only entitlement verification. A failed lookup never grants access. */
export type BillingAccess = "free" | "paid" | "unknown";

export async function getRevenueCatAccess(userId: string): Promise<BillingAccess> {
  const key = process.env.REVENUECAT_SECRET_API_KEY;
  if (!key) return "unknown";
  try {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return "unknown";
    const payload = await response.json() as {
      subscriber?: { entitlements?: Record<string, { expires_date?: string | null }> };
    };
    const entitlements = payload.subscriber?.entitlements;
    if (!entitlements || typeof entitlements !== "object") return "unknown";
    for (const id of ["studymate_pro", "studymate_school"]) {
      const entitlement = entitlements[id];
      if (entitlement && (entitlement.expires_date === null || Boolean(entitlement.expires_date && Date.parse(entitlement.expires_date) > Date.now()))) return "paid";
    }
    return "free";
  } catch {
    return "unknown";
  }
}

export async function hasRevenueCatPro(userId: string): Promise<boolean> {
  return (await getRevenueCatAccess(userId)) === "paid";
}
