"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type ReportDownloadButtonProps = {
  courseId: string;
  courseName: string;
  className?: string;
  disabled?: boolean;
};

export default function ReportDownloadButton({
  courseId,
  courseName,
  className = "",
  disabled = false,
}: ReportDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("Download Revision PDF");
  const stageTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (stageTimerRef.current) {
        window.clearTimeout(stageTimerRef.current);
      }
    };
  }, []);

  const clearStageTimer = () => {
    if (stageTimerRef.current) {
      window.clearTimeout(stageTimerRef.current);
      stageTimerRef.current = null;
    }
  };

  const handleDownload = async () => {
    if (loading || disabled) {
      return;
    }

    setLoading(true);
    setStage("Compiling your data...");

    try {
      clearStageTimer();
      stageTimerRef.current = window.setTimeout(() => setStage("Building PDF..."), 700);

      const response = await fetch("/api/report/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error ?? "Failed to generate report.");
      }

      setStage("Done! Downloading...");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${courseName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-StudyReport.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Report downloaded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate report.";
      toast.error(message);
      setStage("Download Revision PDF");
    } finally {
      clearStageTimer();
      setLoading(false);
      window.setTimeout(() => setStage("Download Revision PDF"), 1200);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {loading ? stage : stage}
    </button>
  );
}
