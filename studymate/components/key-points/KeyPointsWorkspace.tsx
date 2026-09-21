"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { KeyPoint, SubjectType } from "@/types";
import { getKeyPointMeta, getSubjectMeta } from "@/lib/course-utils";
import KeyPointsList from "./KeyPointsList";

type KeyPointsWorkspaceProps = {
  courseId: string;
  subjectType: SubjectType;
  points: KeyPoint[];
};

const filters = [
  { key: "all", label: "All" },
  { key: "principle", label: "Principles" },
  { key: "case", label: "Cases" },
  { key: "formula", label: "Formulas" },
  { key: "maxim", label: "Maxims" },
  { key: "definition", label: "Definitions" },
  { key: "concept", label: "Concepts" },
] as const;

type FilterKey = (typeof filters)[number]["key"];

export default function KeyPointsWorkspace({ courseId, subjectType, points }: KeyPointsWorkspaceProps) {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const subjectMeta = getSubjectMeta(subjectType);

  const visiblePoints = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return points.filter((point) => {
      const matchesFilter = selectedFilter === "all" || point.type === selectedFilter;
      const matchesSearch =
        normalized.length === 0 || point.title.toLowerCase().includes(normalized);

      return matchesFilter && matchesSearch;
    });
  }, [points, search, selectedFilter]);

  const handleExtract = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/agents/key-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      const data = (await response.json()) as { error?: string; count?: number };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to extract key points.");
      }

      toast.success(`Key points extracted! ${data.count ?? 0} pages created.`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to extract key points.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">Key Points</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">Key Points</h1>
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${subjectMeta.badge}`}>
            {subjectMeta.label}
          </div>
        </div>

        <button
          type="button"
          onClick={handleExtract}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Extract Key Points
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-600">
            {points.length} key point{points.length === 1 ? "" : "s"} extracted
          </p>

          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-300 focus:bg-white md:w-80"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = selectedFilter === filter.key;
            const meta = filter.key === "all" ? null : getKeyPointMeta(filter.key);

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setSelectedFilter(filter.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-violet-700 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-violet-200 hover:text-violet-700"
                } ${meta ? `ring-1 ring-inset ${meta.border.replace("border-", "ring-")}` : ""}`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {points.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">No key points yet</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
            Extract the key points from your wiki pages to build an exam-focused revision layer.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleExtract}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Extracting..." : "Extract Key Points"}
            </button>
          </div>
        </div>
      ) : visiblePoints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">No key points match your search</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
            Try another filter or search term, or extract a fresh set from your wiki pages.
          </p>
        </div>
      ) : (
        <KeyPointsList points={visiblePoints} />
      )}
    </section>
  );
}
