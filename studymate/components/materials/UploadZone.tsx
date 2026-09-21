"use client";

import { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CheckCircle2, CircleAlert, Loader2, Upload, FileText, Image as ImageIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatBytes } from "@/lib/course-utils";

type UploadPhase = "queued" | "uploading" | "ocr" | "complete" | "failed";

type SelectedUpload = {
  file: File;
  id: string;
  progress: number;
  phase: UploadPhase;
  error?: string;
};

type UploadZoneProps = {
  courseId: string;
};

function getPreviewIcon(file: File) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (
    type === "application/pdf" ||
    type.startsWith("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".docx")
  ) {
    return FileText;
  }

  return ImageIcon;
}

function getPhaseLabel(phase: UploadPhase) {
  switch (phase) {
    case "uploading":
      return "Uploading";
    case "ocr":
      return "Reading";
    case "complete":
      return "Ready";
    case "failed":
      return "Failed";
    case "queued":
    default:
      return "Queued";
  }
}

function UploadProgressRing({ phase, progress }: { phase: UploadPhase; progress: number }) {
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const value = Math.min(Math.max(progress, 0), 100);
  const color =
    phase === "failed"
      ? "text-rose-500"
      : phase === "complete"
        ? "text-emerald-500"
        : phase === "queued"
          ? "text-gray-400"
          : "text-violet-600";

  return (
    <div className="relative h-8 w-8 shrink-0" aria-label={`${getPhaseLabel(phase)} ${value}%`}>
      <svg className="-rotate-90 transform" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r={radius} className="fill-none stroke-gray-200" strokeWidth="3" />
        <circle
          cx="14"
          cy="14"
          r={radius}
          className={`fill-none ${color} transition-all duration-300`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {phase === "complete" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : phase === "failed" ? (
          <CircleAlert className="h-4 w-4 text-rose-600" />
        ) : (
          <span className="text-[9px] font-bold text-gray-700">{value}%</span>
        )}
      </div>
    </div>
  );
}

export default function UploadZone({ courseId }: UploadZoneProps) {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<SelectedUpload[]>([]);
  const [uploading, setUploading] = useState(false);

  const accept = useMemo(
    () => ({
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    }),
    [],
  );

  const onDrop = (acceptedFiles: File[]) => {
    setSelectedFiles((current) => [
      ...current,
      ...acceptedFiles.map((file) => ({
        file,
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        progress: 0,
        phase: "queued" as const,
      })),
    ]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: true,
  });

  const removeFile = (id: string) => {
    setSelectedFiles((current) => current.filter((entry) => entry.id !== id));
  };

  const updateSelectedFile = (id: string, update: Partial<SelectedUpload>) => {
    setSelectedFiles((current) => current.map((entry) => (entry.id === id ? { ...entry, ...update } : entry)));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Choose at least one file first.");
      return;
    }

    setUploading(true);
    const filesToUpload = [...selectedFiles].sort((a, b) => b.file.size - a.file.size);

    try {
      let successCount = 0;
      const failedMessages: string[] = [];

      for (const entry of filesToUpload) {
        try {
          updateSelectedFile(entry.id, { phase: "uploading", progress: 10, error: undefined });

          const formData = new FormData();
          formData.append("courseId", courseId);
          formData.append("file", entry.file, entry.file.name);
          updateSelectedFile(entry.id, { progress: 40 });

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const uploadJson = (await uploadResponse.json()) as {
            error?: string;
            material?: { id: string; ocr_status?: string; ocr_progress?: number };
          };

          if (!uploadResponse.ok || !uploadJson.material) {
            throw new Error(uploadJson.error ?? `Upload failed for ${entry.file.name}.`);
          }

          updateSelectedFile(entry.id, {
            phase: "queued",
            progress: 100,
            error: undefined,
          });
          successCount += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : `Upload failed for ${entry.file.name}.`;
          updateSelectedFile(entry.id, { phase: "failed", progress: 100, error: message });
          failedMessages.push(message);
        }
      }

      const totalCount = filesToUpload.length;

      if (successCount > 0) {
        toast.success(`${successCount} of ${totalCount} files uploaded and queued for OCR.`);
        window.setTimeout(() => {
          setSelectedFiles((current) => current.filter((entry) => entry.phase === "failed"));
        }, 1500);
        router.refresh();
      }

      if (failedMessages.length > 0) {
        toast.error(`Some files failed: ${failedMessages[0] ?? "Please try again."}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/60 p-6">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border border-dashed p-8 text-center transition ${
          isDragActive
            ? "border-violet-400 bg-white"
            : "border-violet-200 bg-white/70 hover:border-violet-300 hover:bg-white"
        }`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-950">
              {isDragActive ? "Drop files here" : "Drag and drop files here"}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Upload PDF, TXT, MD, DOCX, JPG, or PNG notes for OCR and indexing.
            </p>
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 ? (
        <div className="mt-6 space-y-3">
          <div className="grid gap-3">
            {selectedFiles.map(({ file, id, phase, progress, error }) => {
              const Icon = getPreviewIcon(file);

              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <UploadProgressRing phase={phase} progress={progress} />

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-950">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatBytes(file.size)} - {getPhaseLabel(phase)}
                      </p>
                      {error ? <p className="mt-1 truncate text-xs text-rose-600">{error}</p> : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(id)}
                    disabled={uploading && (phase === "uploading" || phase === "ocr")}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={uploadFiles}
            disabled={uploading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload Files
          </button>
        </div>
      ) : null}
    </section>
  );
}
