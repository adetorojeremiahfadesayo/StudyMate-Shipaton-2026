import { defineConfig } from "vitest/config";
import path from "path";

// Railway sets NODE_ENV=production during builds; React's test helpers need
// its test build. This affects only Vitest, not the following Next.js build.
Object.assign(process.env, { NODE_ENV: "test" });

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    pool: "threads",
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
