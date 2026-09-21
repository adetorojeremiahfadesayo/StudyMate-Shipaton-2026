"use client";

import { useMemo, useState } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";
import type { CourseNote, SubjectType } from "@/types";
import { getSubjectMeta, formatDate } from "@/lib/course-utils";
import NoteEditor from "./NoteEditor";

type NotesWorkspaceProps = {
  courseId: string;
  courseName: string;
  subjectType: SubjectType;
  note: CourseNote | null;
};

function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*-\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number) {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  let cursorY = y;

  for (const line of lines) {
    if (cursorY > doc.internal.pageSize.getHeight() - 18) {
      doc.addPage();
      cursorY = 18;
    }
    doc.text(line, x, cursorY);
    cursorY += 6;
  }

  return cursorY;
}

function downloadNotesPdf(courseName: string, subjectType: SubjectType, content: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 16;
  const maxWidth = doc.internal.pageSize.getWidth() - marginX * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(courseName, marginX, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Subject: ${getSubjectMeta(subjectType).label}`, marginX, 26);
  doc.text(`Generated: ${formatDate(new Date())}`, marginX, 32);

  let cursorY = 44;
  const plainText = markdownToPlainText(content);
  const paragraphs = plainText.split(/\n\s*\n/);

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      cursorY += 4;
      continue;
    }

    const isHeading = /^#{1,6}\s+/.test(paragraph) || /^[A-Z][A-Za-z0-9\s:&-]{3,}$/.test(trimmed);

    if (isHeading) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      cursorY = addWrappedText(doc, trimmed, marginX, cursorY, maxWidth);
      cursorY += 2;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      cursorY = addWrappedText(doc, trimmed, marginX, cursorY, maxWidth);
    }

    cursorY += 4;
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Page ${page} of ${pageCount}`, doc.internal.pageSize.getWidth() - 18, doc.internal.pageSize.getHeight() - 10, {
      align: "right",
    });
  }

  doc.save(`${courseName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-notes.pdf`);
}

export default function NotesWorkspace({ courseId, courseName, subjectType, note }: NotesWorkspaceProps) {
  const router = useRouter();
  const [currentNote, setCurrentNote] = useState<CourseNote | null>(note);
  const [subject, setSubject] = useState<SubjectType>(subjectType);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const subjectMeta = useMemo(() => getSubjectMeta(subject), [subject]);
  const hasNotes = Boolean(currentNote?.content?.trim());

  const handleGenerate = async () => {
    if (generating) {
      return;
    }

    if (hasNotes) {
      const confirmed = window.confirm("Notes already exist for this course. Regenerate them?");
      if (!confirmed) {
        return;
      }
    }

    setGenerating(true);
    try {
      setStatusMessage("Detecting subject...");
      const profileResponse = await fetch("/api/agents/profiling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const profileData = (await profileResponse.json()) as {
        error?: string;
        subject_type?: SubjectType;
        confidence?: number;
      };

      if (!profileResponse.ok) {
        throw new Error(profileData.error ?? "Profiling failed.");
      }

      if (profileData.subject_type) {
        setSubject(profileData.subject_type);
      }

      setStatusMessage("Building notes...");
      const notesResponse = await fetch("/api/agents/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, skipProfiling: true }),
      });
      const notesData = (await notesResponse.json()) as {
        error?: string;
        content?: string;
        noteId?: string;
        subject_type?: SubjectType;
      };

      if (!notesResponse.ok) {
        throw new Error(notesData.error ?? "Notes generation failed.");
      }

      if (notesData.subject_type) {
        setSubject(notesData.subject_type);
      }

      setCurrentNote({
        id: notesData.noteId ?? currentNote?.id ?? crypto.randomUUID(),
        course_id: courseId,
        content: notesData.content ?? "",
        generated_at: new Date().toISOString(),
        edited_at: undefined,
        course_name: courseName,
        subject_type: notesData.subject_type ?? profileData.subject_type ?? subject,
      });
      setStatusMessage("Done!");
      toast.success("Notes generated.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Notes generation failed.";
      toast.error(message);
      setStatusMessage(null);
    } finally {
      setGenerating(false);
      window.setTimeout(() => setStatusMessage(null), 1800);
    }
  };

  const handleSave = async (content: string) => {
    if (!currentNote?.id) {
      throw new Error("No note record to save.");
    }

    const response = await fetch("/api/agents/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: currentNote.id, content }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "Failed to save notes.");
    }

    setCurrentNote((current) =>
      current
        ? {
            ...current,
            content,
            edited_at: new Date().toISOString(),
          }
        : current,
    );
    router.refresh();
  };

  const handleDownload = async () => {
    if (!currentNote?.content?.trim()) {
      toast.error("Generate notes first.");
      return;
    }

    setPdfBusy(true);
    try {
      downloadNotesPdf(courseName, subject, currentNote.content);
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">Study Notes</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">{courseName}</h1>
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${subjectMeta.badge}`}>
            {subjectMeta.label}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {statusMessage ?? (hasNotes ? "Regenerate Notes" : "Generate Notes")}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!hasNotes || pdfBusy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {pdfBusy ? "Preparing PDF..." : "Download PDF"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <span className="rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700">
          {subjectMeta.label}
        </span>
        {currentNote?.edited_at ? (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
            Last edited {formatDate(currentNote.edited_at)}
          </span>
        ) : currentNote?.generated_at ? (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
            Generated {formatDate(currentNote.generated_at)}
          </span>
        ) : null}
      </div>

      {hasNotes && currentNote ? (
        <NoteEditor
          key={`${currentNote.id}-${currentNote.content.length}-${currentNote.edited_at ?? currentNote.generated_at}`}
          content={currentNote.content}
          onSave={handleSave}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">Generate notes from your wiki pages</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
            StudyMate will read the wiki pages built from your materials and turn them into clean revision notes.
          </p>
        </div>
      )}
    </section>
  );
}
