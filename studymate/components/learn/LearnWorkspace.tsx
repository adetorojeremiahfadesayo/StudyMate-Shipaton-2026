"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowRight, FileText, Loader2, Send, Sparkles, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import StoryModePanel from "@/components/shared/StoryModePanel";
import SourcesUsedPanel from "@/components/shared/SourcesUsedPanel";
import { getSubjectMeta } from "@/lib/course-utils";
import type { AnswerMode, EducationLevel, KeyPoint, SubjectType, WikiPage } from "@/types";

type LearnWorkspaceProps = {
  courseId: string;
  courseName: string;
  subjectType: SubjectType;
  educationLevel?: EducationLevel;
  noteContent?: string | null;
  keyPoints: KeyPoint[];
  wikiPages: WikiPage[];
};

export default function LearnWorkspace({
  courseId,
  courseName,
  subjectType,
  educationLevel,
  keyPoints,
  wikiPages,
}: LearnWorkspaceProps) {
  const [mode, setMode] = useState<AnswerMode>("story");
  const [topic, setTopic] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [answerSources, setAnswerSources] = useState<string[]>(() =>
    wikiPages.slice(0, 5).map((page) => page.title || page.source_material || "").filter(Boolean),
  );
  const [knowledgeLayer, setKnowledgeLayer] = useState<string | null>(wikiPages.length > 0 ? "local_wiki_fallback" : null);
  const [loading, setLoading] = useState(false);
  const subject = getSubjectMeta(subjectType);

  const topKeyPoints = useMemo(() => keyPoints.slice(0, 6), [keyPoints]);
  const sourceCount = wikiPages.length;

  const handleExplain = async () => {
    if (!topic.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/agents/explainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, topic: topic.trim(), mode }),
      });
      const data = (await response.json()) as {
        explanation?: string;
        citations?: string[];
        knowledge_layer?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to explain this topic.");
      }
      setAnswer(data.explanation ?? "");
      setAnswerSources(data.citations ?? []);
      setKnowledgeLayer(data.knowledge_layer ?? null);
      toast.success(mode === "story" ? "Story explanation ready." : "Plain explanation ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to explain this topic.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${subject.badge}`}>
              {subject.label}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-950">Learn {courseName}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Ask for a direct explanation or turn the same material into a story. When it clicks, jump straight into exam practice.
              </p>
            </div>
          </div>

          <Link
            href={`/courses/${courseId}/exam-prep`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
          >
            Jump to Exam Prep
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <StoryModePanel
        subjectType={subjectType}
        context="aoc"
        mode={mode}
        onModeChange={setMode}
        educationLevel={educationLevel}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <label htmlFor="learn-topic" className="text-sm font-semibold text-gray-950">
              What should StudyMate explain?
            </label>
            <textarea
              id="learn-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Example: Explain negligence, consideration, Ohm's law, inflation, or any topic from my materials."
              className="mt-3 min-h-[130px] w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-7 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-300 focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={handleExplain}
            disabled={loading || !topic.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? "Explaining..." : mode === "story" ? "Turn this into a story" : "Explain it plainly"}
          </button>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-xl bg-violet-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-500">Sources</p>
              <p className="mt-1 text-2xl font-bold text-violet-950">{sourceCount}</p>
            </div>
            <div className="rounded-xl bg-cyan-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600">Key Points</p>
              <p className="mt-1 text-2xl font-bold text-cyan-950">{keyPoints.length}</p>
            </div>
            <div className="rounded-xl bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">Reward</p>
              <p className="mt-1 text-sm font-bold text-amber-950">Revision PDF</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {answer ? (
            <div className="space-y-5">
              <div className="prose prose-sm max-w-none prose-headings:text-gray-950 prose-p:text-gray-700 prose-strong:text-gray-950">
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
              <SourcesUsedPanel sources={answerSources} knowledgeLayer={knowledgeLayer} />
            </div>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
              <Sparkles className="h-10 w-10 text-violet-600" />
              <h2 className="mt-4 text-xl font-semibold text-gray-950">Your explainer will appear here</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-gray-600">
                Plain Mode gives you direct academic clarity. Story Mode turns the same idea into a real-life scenario, then ends with the exam takeaway.
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-950">Flashcard seeds from this course</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {topKeyPoints.length > 0 ? (
              topKeyPoints.map((point) => (
                <div key={point.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-950">{point.title}</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">{point.content.replace(/[#*_`]/g, "")}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600 md:col-span-2">
                Extract key points after upload to generate flashcards from weak areas.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-6 shadow-sm">
          <Trophy className="h-8 w-8 text-violet-700" />
          <h2 className="mt-4 text-lg font-semibold text-gray-950">End with a reward</h2>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            After Exam Prep, package explanations, stronger answers, key points, and flashcards into your revision PDF.
          </p>
          <Link
            href={`/courses/${courseId}/report`}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-700 transition hover:border-violet-300"
          >
            <FileText className="h-4 w-4" />
            Preview Revision PDF
          </Link>
        </div>
      </section>
    </section>
  );
}
