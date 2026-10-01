// @vitest-environment node
import { describe, expect, it } from "vitest";

describe("StudyMate MCP context helpers", () => {
  it("searches course context and returns source names for Copilot", async () => {
    const { searchCourseContext } = (await import("../scripts/studymate-mcp-server.mjs") as unknown) as {
      searchCourseContext: (
        query: string,
        pages: Array<{ title: string; content: string; source_material?: string }>,
      ) => Array<{ title: string; excerpt: string; source: string }>;
    };

    const results = searchCourseContext("negligence", [
      {
        title: "Negligence",
        source_material: "Law of Torts Lecture Notes.pdf",
        content: "Negligence requires duty, breach, causation, and damage.",
      },
      {
        title: "Consideration",
        source_material: "Contract Notes.docx",
        content: "Consideration is the price paid for a promise.",
      },
    ]);

    expect(results).toEqual([
      {
        title: "Negligence",
        excerpt: "Negligence requires duty, breach, causation, and damage.",
        source: "Law of Torts Lecture Notes.pdf",
      },
    ]);
  });
});
