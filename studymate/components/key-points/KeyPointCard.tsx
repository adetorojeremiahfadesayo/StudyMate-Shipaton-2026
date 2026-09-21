"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { KeyPoint } from "@/types";
import { getKeyPointMeta } from "@/lib/course-utils";

type KeyPointCardProps = {
  point: KeyPoint;
};

function previewContent(content: string) {
  return content.replace(/\s+/g, " ").trim().slice(0, 120);
}

export default function KeyPointCard({ point }: KeyPointCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = getKeyPointMeta(point.type);
  const preview = previewContent(point.content);

  return (
    <article className={`rounded-xl border border-gray-200 bg-white shadow-sm border-l-4 ${meta.border}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}>
            {meta.label}
          </div>

          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-violet-200 hover:text-violet-700"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                View full
              </>
            )}
          </button>
        </div>

        <h3 className="mt-4 text-[18px] font-semibold tracking-tight text-gray-950">{point.title}</h3>
        {!expanded ? <p className="mt-3 text-sm leading-6 text-gray-600">{preview || "No preview available."}</p> : null}

        {expanded ? (
          <div className="mt-4 rounded-2xl bg-gray-50 p-4">
            <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-p:text-sm prose-ul:text-sm prose-ol:text-sm">
              <ReactMarkdown>{point.content}</ReactMarkdown>
            </div>
          </div>
        ) : null}

        {point.source_material ? (
          <p className="mt-4 text-xs text-gray-400">Source: {point.source_material}</p>
        ) : null}
      </div>
    </article>
  );
}
