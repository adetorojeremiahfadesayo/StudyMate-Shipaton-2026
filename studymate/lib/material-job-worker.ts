import { supabaseAdmin } from "@/lib/supabase-admin";
import { processMaterialOcr } from "@/lib/material-ocr";

type MaterialJob = {
  id: string;
  material_id: string;
  course_id: string;
  user_id: string;
  status: string;
  attempts: number;
};

type QueuePayload = {
  materialId: string;
  courseId: string;
  userId: string;
};

declare global {
  var __studymateMaterialWorker:
    | {
        running: boolean;
      }
    | undefined;
}

const workerState = globalThis.__studymateMaterialWorker ?? { running: false };

globalThis.__studymateMaterialWorker = workerState;

function isQueueTableError(errorMessage?: string) {
  const message = errorMessage?.toLowerCase() ?? "";
  return message.includes("material_processing_jobs") || message.includes("relation") || message.includes("does not exist");
}

async function enqueueJob(payload: QueuePayload) {
  const { error } = await supabaseAdmin.from("material_processing_jobs").upsert(
    {
      material_id: payload.materialId,
      course_id: payload.courseId,
      user_id: payload.userId,
      status: "queued",
      attempts: 0,
      last_error: null,
    },
    {
      onConflict: "material_id",
    },
  );

  if (error) {
    throw error;
  }
}

async function claimNextJob() {
  const { data: job, error } = await supabaseAdmin
    .from("material_processing_jobs")
    .select("id, material_id, course_id, user_id, status, attempts")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<MaterialJob>();

  if (error) {
    throw error;
  }

  if (!job) {
    return null;
  }

  const { data: claimedJob, error: claimError } = await supabaseAdmin
    .from("material_processing_jobs")
    .update({
      status: "processing",
      attempts: (job.attempts ?? 0) + 1,
      started_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", job.id)
    .eq("status", "queued")
    .select("id, material_id, course_id, user_id, status, attempts")
    .maybeSingle<MaterialJob>();

  if (claimError) {
    throw claimError;
  }

  return claimedJob;
}

async function completeJob(jobId: string, status: "complete" | "failed", lastError?: string) {
  const update: Record<string, string | null> = {
    status,
    completed_at: new Date().toISOString(),
    last_error: lastError ?? null,
  };

  if (status === "complete") {
    update.last_error = null;
  }

  const { error } = await supabaseAdmin.from("material_processing_jobs").update(update).eq("id", jobId);
  if (error) {
    throw error;
  }
}

async function runWorkerLoop() {
  if (workerState.running) {
    return;
  }

  workerState.running = true;

  try {
    while (true) {
      const job = await claimNextJob();
      if (!job) {
        break;
      }

      try {
        await processMaterialOcr(job.material_id);
        await completeJob(job.id, "complete");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Processing failed.";
        await completeJob(job.id, "failed", message);
      }
    }
  } finally {
    workerState.running = false;
  }
}

export async function scheduleMaterialProcessing(payload: QueuePayload) {
  try {
    await enqueueJob(payload);
    void runWorkerLoop();
    return;
  } catch (error) {
    if (error instanceof Error && isQueueTableError(error.message)) {
      void processMaterialOcr(payload.materialId).catch((fallbackError) => {
        console.error("Material OCR fallback failed:", fallbackError);
      });
      return;
    }

    throw error;
  }
}
