"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Flashcard, SubjectType } from "@/types";
import { getSubjectMeta } from "@/lib/course-utils";
import FlashCardDeck from "./FlashCardDeck";

type FlashcardsWorkspaceProps = {
  courseId: string;
  courseName: string;
  subjectType: SubjectType;
  keyPointsCount: number;
  initialCards: Flashcard[];
};

const filters = [
  { key: "all", label: "All" },
  { key: "review", label: "To Review" },
  { key: "mastered", label: "Mastered" },
] as const;

type FilterKey = (typeof filters)[number]["key"];

export default function FlashcardsWorkspace({
  courseId,
  courseName,
  subjectType,
  keyPointsCount,
  initialCards,
}: FlashcardsWorkspaceProps) {
  const router = useRouter();
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [generating, setGenerating] = useState(false);

  const subjectMeta = getSubjectMeta(subjectType);
  const masteredCount = cards.filter((card) => card.status === "mastered").length;
  const reviewCount = cards.filter((card) => card.status === "review").length;
  const totalCount = cards.length;
  const progressPercent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;
  const remainingCount = reviewCount;

  const handleGenerate = async () => {
    if (generating || keyPointsCount === 0) {
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/agents/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      const data = (await response.json()) as { error?: string; count?: number };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate flashcards.");
      }

      toast.success(`Flashcards generated! ${data.count ?? 0} cards created.`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate flashcards.";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const restartReviewCards = () => {
    setFilter("review");
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">Flashcards</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">{courseName}</h1>
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${subjectMeta.badge}`}>
            {subjectMeta.label}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || keyPointsCount === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {keyPointsCount === 0 ? "Extract key points first" : "Generate Flashcards"}
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-medium text-gray-600">
            {masteredCount} of {totalCount} cards mastered
          </p>
          <div className="flex flex-wrap gap-2">
            {filters.map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => setFilter(entry.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === entry.key
                    ? "bg-violet-700 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-violet-200 hover:text-violet-700"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">No flashcards yet</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
            Generate flashcards from your key points to start a swipeable revision session.
          </p>
        </div>
      ) : (
        <FlashCardDeck
          key={filter}
          cards={cards}
          filter={filter}
          onCardsChange={setCards}
          onRestartReviewCards={restartReviewCards}
        />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Got it</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{masteredCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Review</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{reviewCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Remaining</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{remainingCount}</p>
        </div>
      </div>
    </section>
  );
}
