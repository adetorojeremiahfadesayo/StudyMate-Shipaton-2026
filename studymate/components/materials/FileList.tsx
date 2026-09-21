"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CircleAlert,
  FileText,
  Loader2,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatBytes, formatDate, getOcrMeta } from "@/lib/course-utils";
import type { Material } from "@/types";

type FileListProps = {
  materials: Material[];
};

function getFileIcon(material: Material) {
  if (material.mime_type?.startsWith("image/")) {
    return ImageIcon;
  }

  return FileText;
}

function getRingProgress(status?: Material["ocr_status"], progress?: number) {
  switch (status) {
    case "queued":
      return { value: Math.min(Math.max(progress ?? 8, 8), 30), color: "text-slate-500", track: "stroke-slate-200" };
    case "complete":
      return { value: 100, color: "text-emerald-500", track: "stroke-emerald-100" };
    case "processing":
      return { value: Math.min(Math.max(progress ?? 40, 12), 99), color: "text-amber-500", track: "stroke-amber-100" };
    case "failed":
      return { value: 100, color: "text-rose-500", track: "stroke-rose-100" };
    case "pending":
    default:
      return { value: Math.min(Math.max(progress ?? 6, 6), 25), color: "text-gray-400", track: "stroke-gray-200" };
  }
}

function StatusRing({ status, progress }: { status?: Material["ocr_status"]; progress?: number }) {
  const { value, color, track } = getRingProgress(status, progress);
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const isSpinning = status === "processing";

  return (
    <div className="relative h-7 w-7 shrink-0" aria-hidden="true">
      <svg className="-rotate-90 transform" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r={radius} className={`fill-none ${track}`} strokeWidth="2.5" />
        <circle
          cx="12"
          cy="12"
          r={radius}
          className={`fill-none ${color} transition-all duration-500`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isSpinning ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
        ) : status === "queued" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
        ) : status === "failed" ? (
          <CircleAlert className="h-3.5 w-3.5 text-rose-500" />
        ) : status === "complete" ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <span className="text-[9px] font-semibold text-gray-500">{Math.round(value)}%</span>
        )}
      </div>
    </div>
  );
}

export default function FileList({ materials }: FileListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (materialId: string) => {
    setDeletingId(materialId);
    try {
      const response = await fetch("/api/upload", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ materialId }),
      });

      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Failed to delete file.");
      }

      toast.success("File deleted.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed.";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  if (materials.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          <FileText className="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-semibold text-gray-900">No materials uploaded yet.</p>
        <p className="mt-2 text-sm text-gray-500">
          Add a PDF, image scan, text file, or article link. Once OCR finishes, StudyMate can build your source wiki and recommend the next step.
        </p>
        <Link
          href="/recommendations"
          className="mt-5 inline-flex items-center justify-center rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:border-violet-200"
        >
          See how recommendations work
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {materials.map((material) => {
        const Icon = getFileIcon(material);
        const ocrMeta = getOcrMeta(material.ocr_status);

        return (
          <div
            key={material.id}
            className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-4">
              <StatusRing status={material.ocr_status} progress={material.ocr_progress} />

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-950">{material.file_name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>{material.file_type}</span>
                  <span>•</span>
                  <span>{formatBytes(material.file_size)}</span>
                  <span>•</span>
                  <span>{formatDate(material.created_at)}</span>
                </div>

                <div className="mt-3 inline-flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${ocrMeta.badge}`}>
                    {material.ocr_status === "processing" ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : material.ocr_status === "failed" ? (
                      <CircleAlert className="mr-1 h-3 w-3" />
                    ) : (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    )}
                    {ocrMeta.label}
                  </span>
                  {material.error_message ? (
                    <span className="text-xs text-rose-600">{material.error_message}</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {material.file_url && (
                <a
                  href={material.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
                >
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                  {!material.storage_path ? "Open Link" : "View File"}
                </a>
              )}
              <button
                type="button"
                onClick={() => handleDelete(material.id)}
                disabled={deletingId === material.id}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === material.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
