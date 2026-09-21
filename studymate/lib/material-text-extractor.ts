import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { extractTextFromBuffer } from "@/lib/azure-doc-intelligence";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isDocxFile(mimeType?: string | null, fileName?: string | null) {
  const normalizedMimeType = mimeType?.toLowerCase();
  const normalizedFileName = fileName?.toLowerCase();

  return normalizedMimeType === DOCX_MIME || normalizedMimeType?.includes("wordprocessingml") || normalizedFileName?.endsWith(".docx");
}

async function extractDocxText(fileBuffer: Buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value.trim();
  } catch (err) {
    console.error("Local DOCX parsing failed:", err);
    return "";
  }
}

export async function extractTextWithFallback(fileBuffer: Buffer, mimeType?: string | null, fileName?: string | null) {
  const normalizedMimeType = mimeType?.toLowerCase();
  const isText =
    normalizedMimeType?.startsWith("text/") ||
    normalizedMimeType === "application/json" ||
    normalizedMimeType?.includes("text") ||
    normalizedMimeType?.includes("markdown") ||
    !normalizedMimeType;

  if (isText) {
    try {
      return fileBuffer.toString("utf-8").trim();
    } catch (err) {
      console.error("Local text decoding failed:", err);
    }
  }

  try {
    const azureText = await extractTextFromBuffer(fileBuffer);
    if (azureText) {
      return azureText;
    }
  } catch (error) {
    console.warn("Azure Document Intelligence failed, trying local extraction:", error);
  }

  if (isDocxFile(mimeType, fileName)) {
    const docxText = await extractDocxText(fileBuffer);
    if (docxText) {
      return docxText;
    }
  }

  const isPdf = normalizedMimeType === "application/pdf" || normalizedMimeType?.includes("pdf");
  if (isPdf) {
    try {
      const parser = new PDFParse({ data: fileBuffer });
      const parsed = await parser.getText();
      await parser.destroy();
      return parsed.text?.trim() ?? "";
    } catch (err) {
      console.error("Local PDF parsing failed:", err);
    }
  }

  return "";
}
