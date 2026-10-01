import { jsPDF } from "jspdf";
import type { AocAnswer, CourseNote, Flashcard, KeyPoint, PastQuestion, QuizAttempt, SubjectType, WikiPageType } from "@/types";
import { formatDate, getSubjectMeta } from "@/lib/course-utils";
import type { ReadinessBreakdown } from "@/lib/readiness";

type ReportPdfData = {
  course: {
    name: string;
    subject_type: SubjectType;
    description: string | null;
    created_at: string;
  };
  studentName: string;
  generatedAt: string;
  readinessScore: number;
  readinessBreakdown: ReadinessBreakdown;
  materials: { file_name: string; created_at: string }[];
  notes: CourseNote | null;
  keyPoints: KeyPoint[];
  pastQuestions: PastQuestion[];
  aocAnswers: AocAnswer[];
  flashcards: Flashcard[];
  quizAttempts: QuizAttempt[];
  wikiCountsByType: Record<WikiPageType, number>;
};

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ensurePageSpace(doc: jsPDF, cursorY: number, requiredSpace = 12, topMargin = 18, bottomMargin = 20) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (cursorY + requiredSpace > pageHeight - bottomMargin) {
    doc.addPage();
    return topMargin;
  }

  return cursorY;
}

function addFooter(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setTextColor(185, 185, 195);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("StudyMate", pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - 16, pageHeight - 10, { align: "right" });
  }
}

function writeSectionHeader(doc: jsPDF, title: string, subtitle?: string) {
  const margin = 16;
  let cursorY = ensurePageSpace(doc, 20, 28, 20);
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, margin, cursorY);
  cursorY += 8;

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(107, 114, 128);
    const subtitleLines = doc.splitTextToSize(subtitle, doc.internal.pageSize.getWidth() - margin * 2);
    doc.text(subtitleLines, margin, cursorY);
    cursorY += subtitleLines.length * 5 + 2;
  }

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, cursorY, doc.internal.pageSize.getWidth() - margin, cursorY);
  return cursorY + 8;
}

function writeParagraph(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, options?: { fontSize?: number; bold?: boolean; indent?: number }) {
  const indent = options?.indent ?? 0;
  const fontSize = options?.fontSize ?? 10.5;
  const isBold = options?.bold ?? false;
  doc.setFont("helvetica", isBold ? "bold" : "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(31, 41, 55);

  const effectiveWidth = maxWidth - indent;
  const lines = doc.splitTextToSize(text, effectiveWidth) as string[];
  let cursorY = y;

  lines.forEach((line) => {
    cursorY = ensurePageSpace(doc, cursorY, 8);
    doc.text(line, x + indent, cursorY);
    cursorY += fontSize <= 10 ? 5 : 6;
  });

  return cursorY;
}

function renderMarkdown(doc: jsPDF, markdown: string, startY: number) {
  const margin = 16;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  const blocks = stripMarkdown(markdown).split(/\n/);
  let cursorY = startY;

  blocks.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      cursorY += 2.5;
      return;
    }

    if (/^#{1,3}\s+/.test(rawLine)) {
      const level = rawLine.match(/^#{1,3}/)?.[0].length ?? 2;
      const heading = rawLine.replace(/^#{1,3}\s+/, "").trim();
      cursorY = ensurePageSpace(doc, cursorY, 10);
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(level === 1 ? 14 : level === 2 ? 12.5 : 11.5);
      doc.text(heading, margin, cursorY);
      cursorY += level === 1 ? 8 : 7;
      return;
    }

    if (/^[-•*]\s+/.test(line)) {
      cursorY = writeParagraph(doc, `• ${line.replace(/^[-•*]\s+/, "")}`, margin, cursorY, maxWidth, {
        fontSize: 10.2,
        indent: 3,
      });
      cursorY += 1.5;
      return;
    }

    cursorY = writeParagraph(doc, line, margin, cursorY, maxWidth, { fontSize: 10.2 });
    cursorY += 1.5;
  });

  return cursorY;
}

function renderListSection(doc: jsPDF, title: string, items: string[], emptyText: string, startY: number) {
  let cursorY = startY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(17, 24, 39);
  cursorY = ensurePageSpace(doc, cursorY, 12);
  doc.text(title, 16, cursorY);
  cursorY += 7;

  if (items.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.2);
    doc.setTextColor(107, 114, 128);
    return writeParagraph(doc, emptyText, 16, cursorY, doc.internal.pageSize.getWidth() - 32) + 4;
  }

  items.forEach((item) => {
    cursorY = writeParagraph(doc, `• ${item}`, 16, cursorY, doc.internal.pageSize.getWidth() - 32, { fontSize: 10.2 });
    cursorY += 1;
  });

  return cursorY + 2;
}

function renderKeyPoints(doc: jsPDF, keyPoints: KeyPoint[], startY: number) {
  const typeLabels: Record<KeyPoint["type"], string> = {
    principle: "Principles",
    case: "Cases",
    formula: "Formulas",
    maxim: "Maxims",
    definition: "Definitions",
    concept: "Concepts",
  };

  let cursorY = startY;
  (Object.keys(typeLabels) as Array<KeyPoint["type"]>).forEach((type) => {
    const group = keyPoints.filter((point) => point.type === type);
    if (group.length === 0) {
      return;
    }

    cursorY = ensurePageSpace(doc, cursorY, 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(17, 24, 39);
    doc.text(typeLabels[type], 16, cursorY);
    cursorY += 7;

    group.forEach((point) => {
      cursorY = ensurePageSpace(doc, cursorY, 16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(55, 65, 81);
      cursorY = writeParagraph(doc, point.title, 16, cursorY, doc.internal.pageSize.getWidth() - 32, { fontSize: 11, bold: true });
      cursorY = renderMarkdown(doc, point.content, cursorY);
      cursorY += 4;
    });
  });

  return cursorY;
}

function renderPastQuestions(doc: jsPDF, pastQuestions: PastQuestion[], startY: number) {
  let cursorY = startY;
  pastQuestions.forEach((entry, index) => {
    cursorY = ensurePageSpace(doc, cursorY, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(`${index + 1}. ${entry.question}`, 16, cursorY);
    cursorY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.2);
    doc.setTextColor(107, 114, 128);
    cursorY = writeParagraph(
      doc,
      `Confidence: ${entry.confidence ?? "medium"}${entry.source_pages?.length ? ` | Sources: ${entry.source_pages.join(", ")}` : ""}`,
      16,
      cursorY,
      doc.internal.pageSize.getWidth() - 32,
      { fontSize: 10.2 },
    );
    cursorY += 1.5;

    if (entry.answer?.trim()) {
      cursorY = renderMarkdown(doc, entry.answer, cursorY);
    } else {
      cursorY = writeParagraph(doc, "No answer stored yet.", 16, cursorY, doc.internal.pageSize.getWidth() - 32, {
        fontSize: 10.2,
      });
    }

    cursorY += 5;
  });

  return cursorY;
}

function renderAocAnswers(doc: jsPDF, answers: AocAnswer[], startY: number) {
  let cursorY = startY;
  answers.forEach((entry, index) => {
    cursorY = ensurePageSpace(doc, cursorY, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(`${index + 1}. ${entry.topic}`, 16, cursorY);
    cursorY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.2);
    doc.setTextColor(107, 114, 128);
    cursorY = writeParagraph(doc, `Confidence: ${entry.confidence ?? "medium"}`, 16, cursorY, doc.internal.pageSize.getWidth() - 32, {
      fontSize: 10.2,
    });
    cursorY += 1.5;
    cursorY = renderMarkdown(doc, entry.answer, cursorY);
    cursorY += 5;
  });

  return cursorY;
}

function renderQuizAttempts(doc: jsPDF, attempts: QuizAttempt[], startY: number) {
  let cursorY = startY;
  if (attempts.length === 0) {
    return writeParagraph(doc, "No quiz attempts recorded yet.", 16, cursorY, doc.internal.pageSize.getWidth() - 32, {
      fontSize: 10.2,
    });
  }

  attempts.forEach((attempt, index) => {
    cursorY = ensurePageSpace(doc, cursorY, 16);
    const summary = `${index + 1}. ${attempt.quiz_type.toUpperCase()} | ${attempt.percentage}% | Grade ${attempt.grade} | ${attempt.question_count} questions`;
    cursorY = writeParagraph(doc, summary, 16, cursorY, doc.internal.pageSize.getWidth() - 32, { fontSize: 10.2, bold: true });
    cursorY = writeParagraph(
      doc,
      `Score ${attempt.score}/${attempt.max_score} | Taken ${formatDate(attempt.created_at)}`,
      16,
      cursorY,
      doc.internal.pageSize.getWidth() - 32,
      { fontSize: 10.0 },
    );
    cursorY += 2;
    if (attempt.feedback) cursorY = renderMarkdown(doc, attempt.feedback, cursorY);
    for (const raw of attempt.questions_snapshot || []) {
      const q = raw;
      const answer = (attempt.answers_snapshot || []).find(rawAnswer => (rawAnswer as Record<string, unknown>).questionId === q.id) as Record<string, unknown> | undefined;
      cursorY = writeParagraph(doc, String(q.question || ''), 16, cursorY, doc.internal.pageSize.getWidth() - 32, { bold: true });
      if (q.source_material) cursorY = writeParagraph(doc, `Source: ${q.source_material}`, 16, cursorY, doc.internal.pageSize.getWidth() - 32);
      if (answer) {
        cursorY = writeParagraph(doc, `Your answer: ${answer.answer || answer.studentAnswer || answer.selectedAnswer || ''}`, 16, cursorY, doc.internal.pageSize.getWidth() - 32);
        if (answer.feedback) cursorY = renderMarkdown(doc, String(answer.feedback), cursorY);
        const reference = answer.referenceAnswer || q.model_answer || q.correct_answer;
        if (reference) cursorY = writeParagraph(doc, `Reference answer: ${reference}`, 16, cursorY, doc.internal.pageSize.getWidth() - 32);
      }
      cursorY += 4;
    }
  });

  return cursorY;
}

export function buildStudyReportPdf(report: ReportPdfData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const subjectMeta = getSubjectMeta(report.course.subject_type);

  doc.setFillColor(245, 243, 255);
  doc.rect(0, 0, pageWidth, 80, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(17, 24, 39);
  doc.text("StudyMate Study Report", 16, 28);

  doc.setFontSize(18);
  doc.text(report.course.name, 16, 42);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(221, 214, 254);
  doc.roundedRect(16, 50, 44, 10, 4, 4, "FD");
  doc.setFontSize(10.5);
  doc.setTextColor(109, 40, 217);
  doc.text(subjectMeta.label, 38, 56.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);
  doc.setFontSize(11);
  doc.text(`Student: ${report.studentName}`, 16, 70);
  doc.text(`Date generated: ${formatDate(report.generatedAt)}`, 16, 76);
  doc.text(`Exam Readiness Score`, 128, 66);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(124, 58, 237);
  doc.text(String(report.readinessScore), 128, 78);
  doc.setFontSize(12);
  doc.text("%", 155, 78);

  doc.addPage();

  let cursorY = 20;

  cursorY = writeSectionHeader(doc, "Section 1 — Course Overview", "Everything this report knows about the course workspace.");
  const materialsList = report.materials.map((material) => material.file_name);
  cursorY = renderListSection(doc, "Materials uploaded", materialsList, "No materials uploaded yet.", cursorY);
  cursorY = renderListSection(
    doc,
    "Wiki pages built",
    [
      `Principles: ${report.wikiCountsByType.principle}`,
      `Cases: ${report.wikiCountsByType.case}`,
      `Formulas: ${report.wikiCountsByType.formula}`,
      `Maxims: ${report.wikiCountsByType.maxim}`,
      `Definitions: ${report.wikiCountsByType.definition}`,
      `Concepts: ${report.wikiCountsByType.concept}`,
    ],
    "No wiki pages have been built yet.",
    cursorY,
  );
  cursorY = renderListSection(doc, "Date started", [formatDate(report.course.created_at)], "Unknown date", cursorY);

  doc.addPage();
  cursorY = 20;
  cursorY = writeSectionHeader(doc, "Section 2 — Study Notes", "The notes are rendered in a study-friendly markdown style.");
  if (report.notes?.content?.trim()) {
    cursorY = renderMarkdown(doc, report.notes.content, cursorY);
  } else {
    cursorY = writeParagraph(doc, "No notes have been generated yet.", 16, cursorY, pageWidth - 32, { fontSize: 10.5 });
  }

  doc.addPage();
  cursorY = 20;
  cursorY = writeSectionHeader(doc, "Section 3 — Key Points", "Grouped by type so exam revision is fast and predictable.");
  if (report.keyPoints.length === 0) {
    cursorY = writeParagraph(doc, "No key points have been extracted yet.", 16, cursorY, pageWidth - 32, { fontSize: 10.5 });
  } else {
    cursorY = renderKeyPoints(doc, report.keyPoints, cursorY);
  }

  doc.addPage();
  cursorY = 20;
  cursorY = writeSectionHeader(doc, "Section 4 — Past Questions", "Every answered exam-style question with confidence notes.");
  if (report.pastQuestions.length === 0) {
    cursorY = writeParagraph(doc, "No past questions have been answered yet.", 16, cursorY, pageWidth - 32, { fontSize: 10.5 });
  } else {
    cursorY = renderPastQuestions(doc, report.pastQuestions, cursorY);
  }

  doc.addPage();
  cursorY = 20;
  cursorY = writeSectionHeader(doc, "Section 5 — AOC Answers", "Answer on Command topics and grounded exam-ready answers.");
  if (report.aocAnswers.length === 0) {
    cursorY = writeParagraph(doc, "No AOC answers have been generated yet.", 16, cursorY, pageWidth - 32, { fontSize: 10.5 });
  } else {
    cursorY = renderAocAnswers(doc, report.aocAnswers, cursorY);
  }

  doc.addPage();
  cursorY = 20;
  cursorY = writeSectionHeader(doc, "Section 6 — Quiz Performance", "All quiz attempts and the overall trend across attempts.");
  const quizAverage = report.quizAttempts.length
    ? Math.round(report.quizAttempts.reduce((sum, attempt) => sum + Number(attempt.percentage), 0) / report.quizAttempts.length)
    : 0;
  cursorY = writeParagraph(doc, `Average score across attempts: ${quizAverage}%`, 16, cursorY, pageWidth - 32, {
    fontSize: 10.8,
    bold: true,
  });
  cursorY += 2;
  cursorY = renderQuizAttempts(doc, report.quizAttempts, cursorY);

  doc.addPage();
  cursorY = 20;
  cursorY = writeSectionHeader(doc, "Section 7 — Exam Readiness", "A weighted snapshot of the current exam readiness score.");
  cursorY = writeParagraph(doc, `Quiz: ${report.readinessBreakdown.quiz}%`, 16, cursorY, pageWidth - 32, { fontSize: 10.6 });
  cursorY = writeParagraph(doc, `Past Questions: ${report.readinessBreakdown.pastQuestions}%`, 16, cursorY, pageWidth - 32, {
    fontSize: 10.6,
  });
  cursorY = writeParagraph(doc, `Flashcards: ${report.readinessBreakdown.flashcards}%`, 16, cursorY, pageWidth - 32, {
    fontSize: 10.6,
  });
  cursorY = writeParagraph(doc, `Topics: ${report.readinessBreakdown.topics}%`, 16, cursorY, pageWidth - 32, { fontSize: 10.6 });
  cursorY += 4;
  cursorY = writeParagraph(
    doc,
    "The readiness score will keep improving as more wiki pages, answers, flashcards, and quizzes are added.",
    16,
    cursorY,
    pageWidth - 32,
    { fontSize: 10.4 },
  );
  cursorY += 2;
  writeParagraph(doc, `Overall readiness: ${report.readinessScore}%`, 16, cursorY, pageWidth - 32, {
    fontSize: 13,
    bold: true,
  });
  cursorY += 4;

  addFooter(doc);
  return { doc, fileName: `${sanitizeFileName(report.course.name)}-StudyReport.pdf` };
}
