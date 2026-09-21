"use client";

import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { WikiPage } from "@/types";
import { getWikiTypeMeta } from "@/lib/course-utils";

type WikiPageViewerProps = {
  page: WikiPage;
  open: boolean;
  onClose: () => void;
  onSelectRelatedPage: (title: string) => void;
};

export default function WikiPageViewer({
  page,
  open,
  onClose,
  onSelectRelatedPage,
}: WikiPageViewerProps) {
  if (!open) {
    return null;
  }

  const meta = getWikiTypeMeta(page.type);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-6">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className={`h-1.5 w-full ${meta.accent}`} />

        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}>
              {meta.label}
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-950">{page.title}</h2>
            {page.source_material ? (
              <p className="mt-2 text-sm text-gray-500">Source: {page.source_material}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:text-gray-900"
            aria-label="Close wiki page"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
          <article className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-violet-700 prose-a:no-underline hover:prose-a:underline prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5">
            <ReactMarkdown
              components={{
                h1: (props) => <h1 {...props} className="text-2xl font-bold text-gray-950" />,
                h2: (props) => <h2 {...props} className="mt-6 text-xl font-semibold text-gray-950" />,
                h3: (props) => <h3 {...props} className="mt-5 text-lg font-semibold text-gray-950" />,
                p: (props) => <p {...props} className="mt-3 text-sm leading-7 text-gray-700" />,
                ul: (props) => <ul {...props} className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700" />,
                ol: (props) => <ol {...props} className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700" />,
                li: (props) => <li {...props} className="leading-7" />,
                blockquote: (props) => (
                  <blockquote
                    {...props}
                    className="mt-4 border-l-4 border-violet-200 bg-violet-50 px-4 py-3 text-sm text-gray-700"
                  />
                ),
                code: (props) => <code {...props} className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em]" />,
                pre: (props) => (
                  <pre
                    {...props}
                    className="mt-4 overflow-x-auto rounded-2xl bg-gray-950 p-4 text-sm text-gray-100"
                  />
                ),
                a: (props) => <a {...props} className="text-violet-700 underline decoration-violet-300 underline-offset-2" />,
              }}
            >
              {page.content}
            </ReactMarkdown>
          </article>
        </div>

        {page.related_pages.length > 0 ? (
          <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Related pages</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {page.related_pages.map((relatedPage) => (
                <button
                  key={relatedPage}
                  type="button"
                  onClick={() => onSelectRelatedPage(relatedPage)}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-violet-200 hover:text-violet-700"
                >
                  {relatedPage}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
