#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DEFAULT_CONTEXT = [
  {
    title: "Negligence",
    type: "principle",
    source_material: "Law of Torts Lecture Notes.pdf",
    content: "Negligence requires duty of care, breach of that duty, causation, and damage. In an exam answer, identify each element and apply it to the facts.",
  },
  {
    title: "Donoghue v Stevenson",
    type: "case",
    source_material: "Torts Cases Handout.pdf",
    content: "Donoghue v Stevenson established the neighbour principle: a person must take reasonable care to avoid acts or omissions likely to injure closely and directly affected persons.",
  },
  {
    title: "Specific performance",
    type: "principle",
    source_material: "Equity Seminar Notes.docx",
    content: "Specific performance is a discretionary equitable remedy granted where damages are inadequate, often where the subject matter is unique.",
  },
];

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanExcerpt(value, maxLength = 420) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trim()}...` : normalized;
}

function scorePage(query, page) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const haystack = normalize(`${page.title} ${page.type ?? ""} ${page.source_material ?? ""} ${page.content}`);

  return terms.reduce((score, term) => {
    if (!haystack.includes(term)) return score;
    return score + (normalize(page.title).includes(term) ? 3 : 1);
  }, 0);
}

export function searchCourseContext(query, pages = DEFAULT_CONTEXT, limit = 5) {
  const trimmedQuery = String(query ?? "").trim();
  if (!trimmedQuery) {
    return [];
  }

  return pages
    .map((page) => ({ page, score: scorePage(trimmedQuery, page) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ page }) => ({
      title: String(page.title ?? "Untitled source"),
      excerpt: cleanExcerpt(page.content),
      source: String(page.source_material ?? page.source ?? "Uploaded course material"),
    }));
}

export function loadCourseContext(contextPath = process.env.STUDYMATE_MCP_CONTEXT_FILE) {
  if (!contextPath || !existsSync(contextPath)) {
    return DEFAULT_CONTEXT;
  }

  const parsed = JSON.parse(readFileSync(contextPath, "utf8"));
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed.pages)) {
    return parsed.pages;
  }

  return DEFAULT_CONTEXT;
}

async function startServer() {
  const server = new McpServer({
    name: "studymate-context",
    version: "0.1.0",
  });

  server.registerTool(
    "search_course_context",
    {
      title: "Search StudyMate Course Context",
      description: "Search StudyMate course notes and source pages for cited excerpts Copilot can use.",
      inputSchema: {
        query: z.string().min(1).describe("The study topic, case, formula, or exam concept to search for."),
        limit: z.number().min(1).max(8).optional().describe("Maximum number of cited excerpts to return."),
      },
    },
    async ({ query, limit }) => {
      const results = searchCourseContext(query, loadCourseContext(), limit ?? 5);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ query, results }, null, 2),
          },
        ],
      };
    },
  );

  server.registerResource(
    "studymate-demo-context",
    "studymate://demo-context",
    {
      title: "StudyMate Demo Course Context",
      description: "Read-only sample course context for Copilot and MCP demos.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(loadCourseContext(), null, 2),
        },
      ],
    }),
  );

  await server.connect(new StdioServerTransport());
}

if (!process.env.VITEST && process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer().catch((error) => {
    console.error("StudyMate MCP server failed:", error);
    process.exit(1);
  });
}
