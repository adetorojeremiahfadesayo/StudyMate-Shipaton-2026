import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  cookieUser: vi.fn(),
  routeClient: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/lib/demo-auth", () => ({ IS_DEMO_MODE: false, DEMO_USER: { id: "demo" } }));
vi.mock("@/lib/supabase-admin", () => ({ supabaseAdmin: { auth: { getUser: mocks.getUser }, from: mocks.from } }));
vi.mock("@/lib/supabase-route", () => ({ createSupabaseRouteClient: mocks.routeClient }));
import { getAuthenticatedRouteSupabase, requireCourseOwnership } from "@/lib/route-helpers";

describe("Mobile and judge account isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.routeClient.mockResolvedValue({ auth: { getUser: mocks.cookieUser } });
  });
  it("rejects an invalid bearer token without falling back to cookies", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "Invalid JWT" } });
    expect(await getAuthenticatedRouteSupabase(new Request("https://example.test", { headers: { authorization: "Bearer invalid" } }))).toBeNull();
    expect(mocks.routeClient).not.toHaveBeenCalled();
  });
  it("resolves the verified mobile user's identity", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "student" } }, error: null });
    const auth = await getAuthenticatedRouteSupabase(new Request("https://example.test", { headers: { authorization: "Bearer valid" } }));
    expect(auth?.user.id).toBe("student");
    expect(mocks.getUser).toHaveBeenCalledWith("valid");
  });
  it("rejects unverified cookie authentication", async () => {
    mocks.cookieUser.mockResolvedValue({ data: { user: null }, error: { message: "Expired" } });
    expect(await getAuthenticatedRouteSupabase()).toBeNull();
  });
  it("checks ownership for the legacy demo UUID too", async () => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
    mocks.from.mockReturnValue(query);
    const { supabaseAdmin } = await import("@/lib/supabase-admin");
    const demoId = "c2c92fa5-bb78-4875-93c9-4fc58057a7a9";
    await expect(requireCourseOwnership(supabaseAdmin, "someone-elses-course", demoId)).rejects.toThrow("Course not found");
    expect(query.eq).toHaveBeenCalledWith("user_id", demoId);
  });
});
