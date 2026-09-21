import { NextRequest, NextResponse } from "next/server";
import { extractTextWithFallback } from "@/lib/material-text-extractor";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextWithFallback(buffer, file.type, file.name);

    if (!text) {
      return NextResponse.json({ error: "No readable text could be extracted from this file." }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Extraction failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
