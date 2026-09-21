import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import { Readable } from "node:stream";

const endpoint = process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT;
const key = process.env.AZURE_DOC_INTELLIGENCE_KEY;

function getClient() {
  if (!endpoint || !key) {
    return null;
  }

  return new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
}

type AzureAnalyzeResult = {
  content?: string;
  pages?: Array<{
    lines?: Array<{
      content?: string;
    }>;
  }>;
};

function parseAnalyzeResult(result: AzureAnalyzeResult) {
  const content = result.content?.trim();
  if (content) {
    return content;
  }

  const textLines = (result.pages ?? [])
    .flatMap((page) => page.lines ?? [])
    .map((line) => line.content)
    .filter(Boolean);

  if (textLines.length > 0) {
    return textLines.join("\n").trim();
  }

  return "";
}

async function analyzeBuffer(fileBuffer: Buffer, modelId: string) {
  const client = getClient();
  if (!client) {
    throw new Error("Azure Document Intelligence is not configured.");
  }

  const fileStream = Readable.from(fileBuffer);
  const poller = await client.beginAnalyzeDocument(modelId, fileStream);
  const result = (await poller.pollUntilDone()) as AzureAnalyzeResult;
  return parseAnalyzeResult(result);
}

async function analyzeBufferWithFallback(fileBuffer: Buffer) {
  const primaryText = await analyzeBuffer(fileBuffer, "prebuilt-read");
  if (primaryText) {
    return primaryText;
  }

  return await analyzeBuffer(fileBuffer, "prebuilt-document");
}

export async function extractTextFromFile(fileUrl: string) {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to download file for OCR: ${response.status} ${response.statusText}`);
  }

  const fileBuffer = Buffer.from(await response.arrayBuffer());
  return extractTextFromBuffer(fileBuffer);
}

export async function extractTextFromBuffer(fileBuffer: Buffer) {
  try {
    return await analyzeBufferWithFallback(fileBuffer);
  } catch (error) {
    console.error("Azure Document Intelligence error:", error);
    throw error;
  }
}
