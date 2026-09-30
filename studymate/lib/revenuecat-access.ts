/** Server-only entitlement verification. A failed lookup never grants access. */
export async function hasRevenueCatPro(userId: string): Promise<boolean> {
  const key = process.env.REVENUECAT_SECRET_API_KEY;
  if (!key) return false;
  try {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const payload = await response.json() as {
      subscriber?: { entitlements?: Record<string, { expires_date?: string | null }> };
    };
    const entitlement = payload.subscriber?.entitlements?.studymate_pro;
    if (!entitlement) return false;
    return entitlement.expires_date === null || Boolean(entitlement.expires_date && Date.parse(entitlement.expires_date) > Date.now());
  } catch {
    return false;
  }
}
