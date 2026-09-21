"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import TopicListInput from "./TopicListInput";
import AOCAnswerAccordion from "./AOCAnswerAccordion";
import StoryModePanel from "@/components/shared/StoryModePanel";
import { awardStudyXp } from "@/lib/study-xp-client";
import type { AocAnswer, EducationLevel, SubjectType } from "@/types";
import { getSubjectMeta } from "@/lib/course-utils";

type AOCWorkspaceProps = {
  courseId: string;
  courseName: string;
  subjectType: SubjectType;
  initialAnswers: AocAnswer[];
  educationLevel?: EducationLevel;
  initialStudyXp?: number;
};

export default function AOCWorkspace({
  courseId,
  courseName,
  subjectType,
  initialAnswers,
  educationLevel,
  initialStudyXp = 0,
}: AOCWorkspaceProps) {
  const router = useRouter();
  const subjectMeta = getSubjectMeta(subjectType);
  const [topicsText, setTopicsText] = useState("");
  const [answers, setAnswers] = useState<AocAnswer[]>(initialAnswers);
  const [answerMode, setAnswerMode] = useState<"plain" | "story">("plain");
  const [loading, setLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [storyXp, setStoryXp] = useState(initialStudyXp);

  const topicCount = topicsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;

  const handleGenerate = async () => {
    if (loading || topicCount === 0) {
      return;
    }

    const topics = topicsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    setLoading(true);
    setCompletedCount(0);

    try {
      const response = await fetch("/api/agents/aoc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId, topics, mode: answerMode }),
      });

      const data = (await response.json()) as {
        results?: Array<{
          topic: string;
          answer: string;
          confidence?: "high" | "medium" | "low";
          warning_message?: string | null;
        }>;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate AOC answers.");
      }

      const results = data.results ?? [];
      for (const result of results) {
        setAnswers((current) => [
          {
            id: crypto.randomUUID(),
            course_id: courseId,
            topic: result.topic,
            answer: result.answer,
            confidence: result.confidence ?? "medium",
            warning_message: result.warning_message ?? null,
            created_at: new Date().toISOString(),
          },
          ...current.filter((entry) => entry.topic !== result.topic),
        ]);

        setCompletedCount((current) => current + 1);
        if (answerMode === "story") {
          const awarded = await awardStudyXp(12);
          setStoryXp((current) => awarded?.xp ?? current + 12);
        }
        // Small pause so the checklist feels alive while answers appear.
        await new Promise((resolve) => setTimeout(resolve, 180));
      }

      toast.success(`Generated answers for ${results.length} topics.`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate AOC answers.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = async () => {
    try {
      const payload = answers
        .map((entry) => `## ${entry.topic}\n\n${entry.answer}`)
        .join("\n\n---\n\n");
      await navigator.clipboard.writeText(payload);
      toast.success("All answers copied.");
    } catch {
      toast.error("Unable to copy answers.");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">AOC</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">AOC — Answer on Command</h1>
          <p className="max-w-2xl text-sm text-gray-600">
            Paste a list of topics and get exam-ready answers for each one instantly.
          </p>
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${subjectMeta.badge}`}>
            {subjectMeta.label}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          {answers.length} saved answer{answers.length === 1 ? "" : "s"}
        </div>
      </div>

      <StoryModePanel
        subjectType={subjectType}
        context="aoc"
        mode={answerMode}
        onModeChange={setAnswerMode}
        storyXp={storyXp}
        educationLevel={educationLevel}
      />

      <TopicListInput
        value={topicsText}
        onChange={setTopicsText}
        onGenerate={handleGenerate}
        loading={loading}
        completedCount={completedCount}
        totalCount={topicCount}
      />

      <AOCAnswerAccordion
        key={answers.map((entry) => `${entry.topic}:${entry.confidence ?? "medium"}`).join("|")}
        courseName={courseName}
        answers={answers}
        onCopyAll={handleCopyAll}
      />
    </section>
  );
}
