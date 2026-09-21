import { NextRequest, NextResponse } from "next/server";
import { extractArticleFromUrl } from "@/lib/article-extractor";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { url } = (await request.json()) as { url?: string };
    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
    }

    const { title, content } = await extractArticleFromUrl(url.trim());
    return NextResponse.json({ title, text: content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract article.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
