"use client";

import { useMemo } from "react";
import { CheckCircle2, Copy, Download, RotateCcw, TriangleAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";
import SourcesUsedPanel from "@/components/shared/SourcesUsedPanel";
import { getConfidenceMeta, getSubjectMeta } from "@/lib/course-utils";
import type { ConfidenceLevel, SubjectType } from "@/types";

type AnswerDisplayProps = {
  answer: string;
  confidence?: ConfidenceLevel;
  warningMessage?: string | null;
  sourcePages?: string[];
  courseName: string;
  subjectType: SubjectType;
  question?: string;
  onAskAnother: () => void;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractMarkdownText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\*\*/g, "")
    .replace(/#+/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function AnswerDisplay({
  answer,
  confidence = "medium",
  warningMessage,
  sourcePages = [],
  courseName,
  subjectType,
  question,
  onAskAnother,
}: AnswerDisplayProps) {
  const confidenceMeta = getConfidenceMeta(confidence);
  const subjectMeta = getSubjectMeta(subjectType);

  const sourceTags = useMemo(() => Array.from(new Set(sourcePages.filter(Boolean))), [sourcePages]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      toast.success("Answer copied.");
    } catch {
      toast.error("Unable to copy answer.");
    }
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const maxWidth = pageWidth - margin * 2;
    const lines = doc.splitTextToSize(extractMarkdownText(answer), maxWidth);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(courseName, margin, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Subject: ${subjectMeta.label}`, margin, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 34);

    if (question) {
      const questionLines = doc.splitTextToSize(`Question: ${question}`, maxWidth);
      doc.setFont("helvetica", "bold");
      doc.text(questionLines, margin, 44);
      let cursorY = 44 + questionLines.length * 5 + 4;
      doc.setFont("helvetica", "normal");
      for (const line of lines) {
        if (cursorY > pageHeight - 20) {
          doc.addPage();
          cursorY = 20;
        }
        doc.text(line, margin, cursorY);
        cursorY += 6;
      }
    } else {
      let cursorY = 44;
      for (const line of lines) {
        if (cursorY > pageHeight - 20) {
          doc.addPage();
          cursorY = 20;
        }
        doc.text(line, margin, cursorY);
        cursorY += 6;
      }
    }

    const pageCount = doc.getNumberOfPages();
    for (let index = 1; index <= pageCount; index += 1) {
      doc.setPage(index);
      doc.setFontSize(9);
      doc.text(`Page ${index} of ${pageCount}`, pageWidth - margin - 22, pageHeight - 8);
    }

    doc.save(`${courseName.toLowerCase().replace(/\s+/g, "-")}-answer.pdf`);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-950">Improved exam-ready answer</p>
          <p className="mt-1 text-sm text-gray-500">
            Use this as revision after comparing it with your own attempt.
          </p>
        </div>

        <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${confidenceMeta.badge}`}>
          {confidenceMeta.label}
        </div>
      </div>

      {warningMessage ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
          <p>{warningMessage}</p>
        </div>
      ) : confidence === "high" ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" />
          <p>Verified against the course material.</p>
        </div>
      ) : null}

      <article className="mt-5 rounded-2xl bg-gray-50 p-5">
        <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-h2:text-2xl prose-h3:text-xl prose-p:text-sm prose-p:leading-7 prose-code:rounded prose-code:bg-white prose-code:px-1 prose-code:py-0.5 prose-pre:overflow-x-auto">
          <ReactMarkdown
            components={{
              h1: (props) => {
                const text = String(props.children ?? "");
                return <h1 {...props} id={slugify(text)} className="text-3xl font-bold text-gray-950" />;
              },
              h2: (props) => {
                const text = String(props.children ?? "");
                return <h2 {...props} id={slugify(text)} className="text-2xl font-semibold text-gray-950" />;
              },
              h3: (props) => {
                const text = String(props.children ?? "");
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
            }}
          >
            {answer}
          </ReactMarkdown>
        </div>
      </article>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-violet-200 hover:text-violet-700"
        >
          <Copy className="h-4 w-4" />
          Copy Answer
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-violet-200 hover:text-violet-700"
        >
          <Download className="h-4 w-4" />
          Download as PDF
        </button>
        <button
          type="button"
          onClick={onAskAnother}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
        >
          <RotateCcw className="h-4 w-4" />
          Practice Another Question
        </button>
      </div>

      <div className="mt-5">
        <SourcesUsedPanel sources={sourceTags} knowledgeLayer="course_material" compact />
      </div>
    </section>
  );
}
