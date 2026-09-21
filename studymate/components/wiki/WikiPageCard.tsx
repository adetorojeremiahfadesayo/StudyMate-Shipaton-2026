"use client";

import { ArrowRight } from "lucide-react";
import type { WikiPage } from "@/types";
import { getWikiTypeMeta } from "@/lib/course-utils";

type WikiPageCardProps = {
  page: WikiPage;
  onClick: () => void;
};

function getPreview(content: string) {
  return content.replace(/\s+/g, " ").trim().slice(0, 100);
}

export default function WikiPageCard({ page, onClick }: WikiPageCardProps) {
  const meta = getWikiTypeMeta(page.type);
  const preview = getPreview(page.content);
  const related = page.related_pages.slice(0, 3);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${meta.border} border-l-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}>
          {meta.label}
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-gray-950">{page.title}</h3>
      <p className="mt-3 text-sm leading-6 text-gray-600">{preview || "No preview available."}</p>

      {related.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Related:</span>
          {related.map((item) => (
            <span
              key={item}
              className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}
