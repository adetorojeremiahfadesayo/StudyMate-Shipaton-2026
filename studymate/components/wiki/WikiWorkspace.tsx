"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { WikiPage } from "@/types";
import { getWikiTypeMeta } from "@/lib/course-utils";
import BuildWikiButton from "./BuildWikiButton";
import WikiPageCard from "./WikiPageCard";
import WikiPageViewer from "./WikiPageViewer";

type WikiWorkspaceProps = {
  courseId: string;
  courseName: string;
  subjectType: string;
  pages: WikiPage[];
  indexedMaterialsCount: number;
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

export default function WikiWorkspace({
  courseId,
  courseName,
  subjectType,
  pages,
  indexedMaterialsCount,
}: WikiWorkspaceProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [selectedTitle, setSelectedTitle] = useState<string | null>(pages[0]?.title ?? null);

  const visiblePages = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return pages.filter((page) => {
      const matchesFilter = selectedFilter === "all" || page.type === selectedFilter;
      const matchesSearch =
        normalizedSearch.length === 0 || page.title.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [pages, search, selectedFilter]);

  const pagesByTitle = useMemo(() => {
    return new Map(pages.map((page) => [page.title, page]));
  }, [pages]);

  const setPageByTitle = (title: string) => {
    if (pagesByTitle.has(title)) {
      setSelectedTitle(title);
    }
  };

  const selectedPage = useMemo(() => {
    const selected = selectedTitle ? pagesByTitle.get(selectedTitle) : null;

    if (selected) {
      const matchesFilter = selectedFilter === "all" || selected.type === selectedFilter;
      const matchesSearch =
        search.trim().length === 0 || selected.title.toLowerCase().includes(search.trim().toLowerCase());

      if (matchesFilter && matchesSearch) {
        return selected;
      }
    }

    return visiblePages[0] ?? null;
  }, [pagesByTitle, search, selectedFilter, selectedTitle, visiblePages]);
  const pageForViewer = visiblePages.length > 0 ? selectedPage : null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">Course Wiki</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">{courseName}</h1>
          <p className="max-w-2xl text-sm text-gray-600">
            StudyMate turns your indexed materials into structured wiki pages that the rest of the app can query.
            Subject focus: <span className="font-semibold text-gray-900">{subjectType}</span>
          </p>
        </div>

        <BuildWikiButton
          courseId={courseId}
          disabled={indexedMaterialsCount === 0}
          className="lg:min-w-[220px]"
          label={indexedMaterialsCount === 0 ? "Upload materials first" : "Build Wiki"}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Search</p>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search wiki pages by title"
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const isActive = selectedFilter === filter.key;
              const typeMeta = filter.key === "all" ? null : getWikiTypeMeta(filter.key);

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setSelectedFilter(filter.key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-violet-700 text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-violet-200 hover:text-violet-700"
                  } ${typeMeta?.ring ? `ring-1 ring-inset ${typeMeta.ring}` : ""}`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700">
            {visiblePages.length} page{visiblePages.length === 1 ? "" : "s"} shown
          </span>
          <span>{pages.length} total wiki page{pages.length === 1 ? "" : "s"}</span>
          <span>{indexedMaterialsCount} indexed material{indexedMaterialsCount === 1 ? "" : "s"}</span>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">Upload materials and click Build Wiki to get started</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
            Once OCR is finished, the WikiAgent can extract principles, cases, formulas, and key concepts into
            structured study pages.
          </p>
          <div className="mt-6 flex justify-center">
            <BuildWikiButton
              courseId={courseId}
              disabled={indexedMaterialsCount === 0}
              label={indexedMaterialsCount === 0 ? "Upload materials first" : "Build Wiki"}
            />
          </div>
        </div>
      ) : visiblePages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">No wiki pages match your search</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
            Try a different filter or search term. If you want a fresh knowledge base, rebuild the wiki from your
            indexed materials.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3 md:grid-cols-2">
          {visiblePages.map((page) => (
            <WikiPageCard key={page.id} page={page} onClick={() => setSelectedTitle(page.title)} />
          ))}
        </div>
      )}

      {pageForViewer ? (
        <WikiPageViewer
          page={pageForViewer}
          open={Boolean(pageForViewer)}
          onClose={() => setSelectedTitle(null)}
          onSelectRelatedPage={setPageByTitle}
        />
      ) : null}
    </section>
  );
}
