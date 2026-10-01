/** Server-only entitlement verification. A failed lookup never grants access. */
export type BillingAccess = "free" | "paid" | "unknown";

type Entitlement = { expires_date?: string | null; grace_period_expires_date?: string | null; product_identifier?: string };
type Subscription = { is_sandbox?: boolean; refunded_at?: string | null };

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
      subscriber?: { entitlements?: Record<string, Entitlement>; subscriptions?: Record<string, Subscription> };
    };
    const entitlements = payload.subscriber?.entitlements;
    if (!entitlements || typeof entitlements !== "object") return "unknown";
    let unverifiable = false;
    const sandboxUsers = (process.env.REVENUECAT_SANDBOX_USER_IDS || "").split(",").map(id => id.trim()).filter(Boolean);
    for (const id of ["studymate_pro", "studymate_school"]) {
      const entitlement = entitlements[id];
      if (!entitlement) continue;
      const active = entitlement.expires_date === null ||
        Boolean(entitlement.expires_date && Date.parse(entitlement.expires_date) > Date.now()) ||
        Boolean(entitlement.grace_period_expires_date && Date.parse(entitlement.grace_period_expires_date) > Date.now());
      if (!active) continue;
      const subscription = entitlement.product_identifier && payload.subscriber?.subscriptions?.[entitlement.product_identifier];
      // Do not infer environment from a client flag or a missing transaction.
      if (!subscription || typeof subscription.is_sandbox !== "boolean") { unverifiable = true; continue; }
      if (subscription.refunded_at) continue;
      if (!subscription.is_sandbox || sandboxUsers.includes(userId)) return "paid";
    }
    return unverifiable ? "unknown" : "free";
  } catch {
    return "unknown";
  }
}

export async function hasRevenueCatPro(userId: string): Promise<boolean> {
  return (await getRevenueCatAccess(userId)) === "paid";
}
