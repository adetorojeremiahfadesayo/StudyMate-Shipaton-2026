import { extractTextWithFallback } from "@/lib/material-text-extractor";
import { supabaseAdmin } from "@/lib/supabase-admin";

type MaterialRow = {
  id: string;
  course_id: string;
  storage_path: string | null;
  file_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_type: string | null;
};

function isMissingOcrProgressError(errorMessage?: string) {
  return Boolean(errorMessage?.toLowerCase().includes("ocr_progress"));
}

async function updateMaterialProgress(materialId: string, progress: number, status = "processing") {
  const { error } = await supabaseAdmin
    .from("materials")
    .update({
      ocr_status: status,
      ocr_progress: progress,
    })
    .eq("id", materialId);

  if (error?.message.toLowerCase().includes("ocr_progress")) {
    await supabaseAdmin
      .from("materials")
      .update({
        ocr_status: status,
      })
      .eq("id", materialId);
  }
}

async function markMaterialFailed(materialId: string, errorMessage: string) {
  const { error } = await supabaseAdmin
    .from("materials")
    .update({
      ocr_status: "failed",
      ocr_progress: 100,
      indexed: false,
      error_message: errorMessage,
    })
    .eq("id", materialId);

  if (error?.message.toLowerCase().includes("ocr_progress")) {
    await supabaseAdmin
      .from("materials")
      .update({
        ocr_status: "failed",
        indexed: false,
        error_message: errorMessage,
      })
      .eq("id", materialId);
  }
}

function getFileSourceUrl(material: MaterialRow, fileUrlOverride?: string) {
  return fileUrlOverride ?? material.file_url ?? undefined;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function processMaterialOcr(materialId: string, fileUrlOverride?: string) {
  const { data: material, error: materialError } = await supabaseAdmin
    .from("materials")
    .select("id, course_id, storage_path, file_url, file_name, mime_type, file_type")
    .eq("id", materialId)
    .maybeSingle<MaterialRow>();

  if (materialError) {
    throw new Error(materialError.message);
  }

  if (!material) {
    throw new Error("Material not found.");
  }

  await updateMaterialProgress(materialId, 20);
  await supabaseAdmin
    .from("materials")
    .update({
      error_message: null,
    })
    .eq("id", materialId);

  const fileContentType = material.mime_type ?? material.file_type ?? undefined;
  const fallbackFileUrl = getFileSourceUrl(material, fileUrlOverride);
  let fileBuffer: Buffer | null = null;

  if (material.storage_path) {
    const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage.from("materials").download(material.storage_path);

    if (downloadError) {
      console.warn("Unable to download material from storage:", downloadError.message ?? downloadError);
    } else if (fileBlob) {
      fileBuffer = Buffer.from(await fileBlob.arrayBuffer());
      await updateMaterialProgress(materialId, 35);
    }
  }

  if (!fileBuffer && fallbackFileUrl) {
    const response = await fetch(fallbackFileUrl);
    if (!response.ok) {
      console.warn("Failed to fetch fallback material URL for OCR:", response.status, response.statusText);
    } else {
      fileBuffer = Buffer.from(await response.arrayBuffer());
      await updateMaterialProgress(materialId, 35);
    }
  }

  if (!fileBuffer) {
    await markMaterialFailed(materialId, "Missing file source for OCR.");
    throw new Error("Missing file source for OCR.");
  }

  await updateMaterialProgress(materialId, 60);

  const extractedText = await withTimeout(
    extractTextWithFallback(fileBuffer, fileContentType, material.file_name),
    120_000,
    "OCR timed out while processing the file.",
  );

  if (!extractedText) {
    await markMaterialFailed(materialId, "No readable text was extracted.");
    throw new Error("OCR did not return any text.");
  }

  let { error: updateError } = await supabaseAdmin
    .from("materials")
    .update({
      ocr_text: extractedText,
      ocr_status: "complete",
      ocr_progress: 100,
      indexed: true,
      error_message: null,
    })
    .eq("id", materialId);

  if (isMissingOcrProgressError(updateError?.message)) {
    const fallbackResult = await supabaseAdmin
      .from("materials")
      .update({
        ocr_text: extractedText,
        ocr_status: "complete",
        indexed: true,
        error_message: null,
      })
      .eq("id", materialId);

    updateError = fallbackResult.error;
  }

  if (updateError) {
    throw new Error(updateError.message);
  }

  return extractedText;
}

export async function setMaterialQueued(materialId: string) {
  const { error } = await supabaseAdmin
    .from("materials")
    .update({
      ocr_status: "queued",
      ocr_progress: 0,
      error_message: null,
    })
    .eq("id", materialId);

  if (isMissingOcrProgressError(error?.message)) {
    await supabaseAdmin
      .from("materials")
      .update({
        ocr_status: "queued",
        error_message: null,
      })
      .eq("id", materialId);
  }
}
