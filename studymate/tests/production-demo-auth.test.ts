import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

it("never replaces deployed authentication with the global demo user", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
  vi.resetModules();
  const { IS_DEMO_MODE } = await import("@/lib/demo-auth");
  expect(IS_DEMO_MODE).toBe(false);
});
