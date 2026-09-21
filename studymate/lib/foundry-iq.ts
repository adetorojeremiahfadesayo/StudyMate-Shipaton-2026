import { DEMO_COURSE, DEMO_WIKI_PAGES } from "@/lib/demo-data";

export type FoundryKnowledgePage = {
  title: string;
  type: string;
  content: string;
  source_material?: string | null;
};

type RetrieveStudyContextInput = {
  courseId: string;
  query: string;
  wikiPages: FoundryKnowledgePage[];
  topK?: number;
};

type FoundryIqApiResult = {
  pages: FoundryKnowledgePage[];
  usedFoundryIq: boolean;
  citations: string[];
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scorePage(query: string, page: FoundryKnowledgePage) {
  const terms = new Set(normalize(query).split(/\s+/).filter(Boolean));
  const haystack = normalize(`${page.title} ${page.type} ${page.content}`);

  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) {
      score += page.title.toLowerCase().includes(term) ? 3 : 1;
    }
  }

  return score;
}

function fallbackRetrieve({
  query,
  wikiPages,
  topK = 5,
}: RetrieveStudyContextInput): FoundryIqApiResult {
  const ranked = [...wikiPages]
    .map((page) => ({ page, score: scorePage(query, page) }))
    .sort((a, b) => b.score - a.score);

  const selected = ranked.some((entry) => entry.score > 0)
    ? ranked.filter((entry) => entry.score > 0).slice(0, topK).map((entry) => entry.page)
    : wikiPages.slice(0, topK);

  return {
    pages: selected,
    usedFoundryIq: false,
    citations: selected.map((page) => page.title),
  };
}

function parseFoundryPages(payload: unknown): FoundryKnowledgePage[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidate = payload as {
    pages?: unknown;
    results?: unknown;
    value?: unknown;
    citations?: unknown;
  };

  const rawItems = Array.isArray(candidate.pages)
    ? candidate.pages
    : Array.isArray(candidate.results)
      ? candidate.results
      : Array.isArray(candidate.value)
        ? candidate.value
        : Array.isArray(candidate.citations)
          ? candidate.citations
          : [];

  return rawItems
    .map((item): FoundryKnowledgePage | null => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const title = record.title ?? record.name ?? record.source ?? record.source_page;
      const content = record.content ?? record.text ?? record.chunk ?? record.answer;

      if (typeof title !== "string" || typeof content !== "string") {
        return null;
      }

      return {
        title,
        type: typeof record.type === "string" ? record.type : "concept",
        content,
        source_material:
          typeof record.source_material === "string"
            ? record.source_material
            : typeof record.source === "string"
              ? record.source
              : null,
      };
    })
    .filter((page): page is FoundryKnowledgePage => Boolean(page));
}

async function retrieveFromFoundryIq({
  courseId,
  query,
  topK,
}: RetrieveStudyContextInput): Promise<FoundryIqApiResult | null> {
  const endpoint = process.env.FOUNDRY_IQ_ENDPOINT?.trim();
  const apiKey = process.env.FOUNDRY_IQ_KEY?.trim() ?? process.env.FOUNDRY_IQ_API_KEY?.trim();
  const knowledgeBase = process.env.FOUNDRY_IQ_KNOWLEDGE_BASE?.trim();

  if (!endpoint || !apiKey) {
    return null;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        topK: topK ?? 5,
        courseId,
        knowledgeBase,
      }),
    });

    if (!response.ok) {
      console.warn(`[Foundry IQ] Retrieval failed with ${response.status}. Falling back to local wiki.`);
      return null;
    }

    const payload = (await response.json()) as unknown;
    const pages = parseFoundryPages(payload);
    if (pages.length === 0) {
      return null;
    }

    return {
      pages,
      usedFoundryIq: true,
      citations: pages.map((page) => page.title),
    };
  } catch (error) {
    console.warn("[Foundry IQ] Retrieval request failed. Falling back to local wiki.", error);
    return null;
  }
}

export async function retrieveStudyContext(input: RetrieveStudyContextInput): Promise<FoundryIqApiResult> {
  const wikiPages =
    input.courseId === DEMO_COURSE.id && input.wikiPages.length === 0
      ? DEMO_WIKI_PAGES
      : input.wikiPages;

  const foundryResult = await retrieveFromFoundryIq({ ...input, wikiPages });
  if (foundryResult) {
    return foundryResult;
  }

  return fallbackRetrieve({ ...input, wikiPages });
}
