"use client";

import { useState } from "react";
import { Check, Copy, Download, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";
import { getConfidenceMeta } from "@/lib/course-utils";
import type { AocAnswer } from "@/types";

type AOCAnswerAccordionProps = {
  courseName: string;
  answers: AocAnswer[];
  onCopyAll: () => void;
};

function normalizeMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\*\*/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function AOCAnswerAccordion({ courseName, answers, onCopyAll }: AOCAnswerAccordionProps) {
  const [openTopic, setOpenTopic] = useState<string>(answers[0]?.topic ?? "");

  const copyTopic = async (answer: string) => {
    try {
      await navigator.clipboard.writeText(answer);
      toast.success("Copied.");
    } catch {
      toast.error("Unable to copy.");
    }
  };

  const downloadAllPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const maxWidth = pageWidth - margin * 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(courseName, margin, 24);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`AOC answers generated on ${new Date().toLocaleDateString()}`, margin, 32);
    doc.text("Answer on Command", margin, 40);

    let cursorY = 52;
    answers.forEach((entry, index) => {
      const header = `${index + 1}. ${entry.topic}`;
      const headerLines = doc.splitTextToSize(header, maxWidth);
      const bodyLines = doc.splitTextToSize(normalizeMarkdown(entry.answer), maxWidth);
      const blockHeight = (headerLines.length + bodyLines.length + 2) * 6;

      if (cursorY + blockHeight > pageHeight - 16) {
        doc.addPage();
        cursorY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text(headerLines, margin, cursorY);
      cursorY += headerLines.length * 6 + 2;

      doc.setFont("helvetica", "normal");
      bodyLines.forEach((line: string) => {
        if (cursorY > pageHeight - 12) {
          doc.addPage();
          cursorY = 20;
        }
        doc.text(line, margin, cursorY);
        cursorY += 6;
      });

      cursorY += 6;
    });

    const totalPages = doc.getNumberOfPages();
    for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
      doc.setPage(pageIndex);
      doc.setFontSize(9);
      doc.text(`Page ${pageIndex} of ${totalPages}`, pageWidth - margin - 22, pageHeight - 8);
    }

    doc.save(`${courseName.toLowerCase().replace(/\s+/g, "-")}-aoc-answers.pdf`);
  };

  const answerCount = answers.length;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-950">AOC Answers</h2>
          <p className="mt-1 text-sm text-gray-500">
            {answerCount} topic{answerCount === 1 ? "" : "s"} ready.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCopyAll}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-violet-200 hover:text-violet-700"
          >
            <Copy className="h-4 w-4" />
            Copy All
          </button>
          <button
            type="button"
            onClick={downloadAllPdf}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-violet-200 hover:text-violet-700"
          >
            <Download className="h-4 w-4" />
            Download All as PDF
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {answers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <p className="text-sm text-gray-600">Generate answers for topics to see them here.</p>
          </div>
        ) : (
          answers.map((entry) => {
            const meta = getConfidenceMeta(entry.confidence ?? "medium");
            const isOpen = openTopic === entry.topic;

            return (
              <article key={entry.topic} className="overflow-hidden rounded-2xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setOpenTopic(isOpen ? "" : entry.topic)}
                  className="flex w-full items-center justify-between gap-3 bg-gray-50 px-4 py-4 text-left transition hover:bg-gray-100"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-950">{entry.topic}</p>
                    <div className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}>
                      {meta.label}
                    </div>
                  </div>

                  {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                </button>

                {isOpen ? (
                  <div className="bg-white px-4 py-5">
                    {entry.warning_message ? (
                      <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {entry.warning_message}
                      </div>
                    ) : null}

                    <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-h2:text-2xl prose-h3:text-xl prose-p:text-sm prose-p:leading-7 prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-pre:overflow-x-auto">
                      <ReactMarkdown>{entry.answer}</ReactMarkdown>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void copyTopic(entry.answer)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-violet-200 hover:text-violet-700"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </button>
                      <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-emerald-600" />
                        {meta.label}
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
