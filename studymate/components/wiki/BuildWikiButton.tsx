"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type BuildWikiButtonProps = {
  courseId: string;
  disabled?: boolean;
  className?: string;
  label?: string;
};

export default function BuildWikiButton({
  courseId,
  disabled = false,
  className = "",
  label = "Build Wiki",
}: BuildWikiButtonProps) {
  const router = useRouter();
  const [building, setBuilding] = useState(false);

  const handleBuild = async () => {
    if (disabled || building) {
      return;
    }

    setBuilding(true);

    try {
      const response = await fetch("/api/agents/wiki", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      const data = (await response.json()) as {
        error?: string;
        pagesCreated?: number;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to build wiki.");
      }

      toast.success(data.message ?? `Wiki built! ${data.pagesCreated ?? 0} pages created.`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to build wiki.";
      toast.error(message);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBuild}
      disabled={disabled || building}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {building ? "Building your wiki..." : label}
    </button>
  );
}
