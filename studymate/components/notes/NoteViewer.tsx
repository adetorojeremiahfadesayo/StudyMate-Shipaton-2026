"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";

type NoteViewerProps = {
  content: string;
};

type TocItem = {
  id: string;
  title: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractToc(markdown: string) {
  const lines = markdown.split("\n");
  const items: TocItem[] = [];

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (match?.[1]) {
      const title = match[1].trim();
      items.push({ id: slugify(title), title });
    }
  }

  return items;
}

export default function NoteViewer({ content }: NoteViewerProps) {
  const toc = useMemo(() => extractToc(content), [content]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-h2:text-2xl prose-h3:text-xl prose-a:text-violet-700 prose-a:no-underline hover:prose-a:underline prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-pre:overflow-x-auto">
          <ReactMarkdown
            components={{
              h1: (props) => {
                const children = props.children;
                const text = Array.isArray(children) ? children.join("") : String(children ?? "");
                return <h1 {...props} id={slugify(text)} className="text-3xl font-bold text-gray-950" />;
              },
              h2: (props) => {
                const children = props.children;
                const text = Array.isArray(children) ? children.join("") : String(children ?? "");
                return <h2 {...props} id={slugify(text)} className="text-2xl font-semibold text-gray-950" />;
              },
              h3: (props) => {
                const children = props.children;
                const text = Array.isArray(children) ? children.join("") : String(children ?? "");
                return <h3 {...props} id={slugify(text)} className="text-xl font-semibold text-gray-950" />;
              },
              p: (props) => <p {...props} className="text-sm leading-7 text-gray-700" />,
              ul: (props) => <ul {...props} className="space-y-2 pl-5 text-sm text-gray-700" />,
              ol: (props) => <ol {...props} className="space-y-2 pl-5 text-sm text-gray-700" />,
              li: (props) => <li {...props} className="leading-7" />,
              blockquote: (props) => (
                <blockquote
                  {...props}
                  className="border-l-4 border-violet-200 bg-violet-50 px-4 py-3 text-sm text-gray-700"
                />
              ),
              code: (props) => (
                <code {...props} className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.9em]" />
              ),
              pre: (props) => (
                <pre {...props} className="overflow-x-auto rounded-2xl bg-gray-950 p-4 text-sm text-gray-100" />
              ),
              table: (props) => (
                <div className="overflow-x-auto">
                  <table {...props} className="min-w-full border-collapse text-sm" />
                </div>
              ),
              th: (props) => <th {...props} className="border border-gray-200 bg-gray-50 px-3 py-2 text-left" />,
              td: (props) => <td {...props} className="border border-gray-200 px-3 py-2" />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </article>

      <aside className="hidden lg:block">
        <div className="sticky top-28 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-950">Table of contents</p>
          {toc.length > 0 ? (
            <nav className="mt-4 space-y-2">
              {toc.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition hover:bg-violet-50 hover:text-violet-700"
                >
                  {item.title}
                </button>
              ))}
            </nav>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No section headings found yet.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
