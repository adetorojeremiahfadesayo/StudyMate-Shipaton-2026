"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import type { Flashcard } from "@/types";
import FlashCard from "./FlashCard";

type FlashCardDeckProps = {
  cards: Flashcard[];
  filter: "all" | "review" | "mastered";
  onCardsChange: (cards: Flashcard[]) => void;
  onRestartReviewCards: () => void;
};

export default function FlashCardDeck({
  cards,
  filter,
  onCardsChange,
  onRestartReviewCards,
}: FlashCardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (filter === "review") {
        return card.status === "review";
      }
      if (filter === "mastered") {
        return card.status === "mastered";
      }
      return true;
    });
  }, [cards, filter]);

  const safeIndex = filteredCards.length === 0 ? 0 : Math.min(currentIndex, filteredCards.length - 1);
  const currentCard = filteredCards[safeIndex] ?? null;
  const masteredCount = cards.filter((card) => card.status === "mastered").length;
  const totalCount = cards.length;
  const progressPercent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;
  const sessionComplete = filteredCards.length > 0 && reviewedIds.size >= filteredCards.length;

  const markStatus = useCallback(
    async (card: Flashcard, status: "review" | "mastered") => {
      if (busyId === card.id) {
        return;
      }

      setBusyId(card.id);
      const previousCards = cards;
      const nextCards = cards.map((entry) => (entry.id === card.id ? { ...entry, status } : entry));
      onCardsChange(nextCards);

      try {
        const response = await fetch("/api/agents/flashcards", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ flashcardId: card.id, status }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to update flashcard.");
        }

        setReviewedIds((current) => {
          const next = new Set(current);
          next.add(card.id);
          return next;
        });

        if (filter === "all") {
          setCurrentIndex((current) => Math.min(current + 1, Math.max(filteredCards.length - 1, 0)));
        }

        setIsFlipped(false);
        toast.success(status === "mastered" ? "Marked as got it." : "Marked for review.");
      } catch (error) {
        onCardsChange(previousCards);
        const message = error instanceof Error ? error.message : "Failed to update flashcard.";
        toast.error(message);
      } finally {
        setBusyId(null);
      }
    },
    [busyId, cards, filter, filteredCards.length, onCardsChange],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (!currentCard) {
        return;
      }

      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setIsFlipped((current) => !current);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setCurrentIndex((current) => Math.min(current + 1, Math.max(filteredCards.length - 1, 0)));
        setIsFlipped(false);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrentIndex((current) => Math.max(current - 1, 0));
        setIsFlipped(false);
        return;
      }

      if (event.key.toLowerCase() === "g") {
        event.preventDefault();
        void markStatus(currentCard, "mastered");
        return;
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        void markStatus(currentCard, "review");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentCard, filteredCards.length, markStatus]);

  const moveNext = () => {
    setCurrentIndex((current) => Math.min(current + 1, Math.max(filteredCards.length - 1, 0)));
    setIsFlipped(false);
  };

  const movePrevious = () => {
    setCurrentIndex((current) => Math.max(current - 1, 0));
    setIsFlipped(false);
  };

  if (filteredCards.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-gray-950">No flashcards yet</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
          Generate flashcards from your key points to start a swipeable revision session.
        </p>
      </div>
    );
  }

  if (sessionComplete) {
    const mastered = cards.filter((card) => card.status === "mastered").length;
    const review = cards.filter((card) => card.status === "review").length;

    return (
      <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-gray-950">Session complete!</h2>
        <p className="mt-3 text-sm text-gray-600">
          {mastered} mastered, {review} to review.
        </p>
        <button
          type="button"
          onClick={onRestartReviewCards}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
        >
          <RotateCcw className="h-4 w-4" />
          Restart with review cards only
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <button
          type="button"
          onClick={movePrevious}
          disabled={safeIndex === 0}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 font-medium transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>

        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
          Card {safeIndex + 1} of {filteredCards.length}
        </span>

        <button
          type="button"
          onClick={moveNext}
          disabled={safeIndex >= filteredCards.length - 1}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 font-medium transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {currentCard ? (
        <div className="flex justify-center">
          <FlashCard
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped((current) => !current)}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => currentCard && void markStatus(currentCard, "mastered")}
          disabled={!currentCard || busyId === currentCard.id}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 className="h-4 w-4" />
          Got it ✓
        </button>
        <button
          type="button"
          onClick={() => currentCard && void markStatus(currentCard, "review")}
          disabled={!currentCard || busyId === currentCard.id}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className="h-4 w-4" />
          Review again
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">
        Keyboard shortcuts: Space or Enter = flip, Left/Right arrows = navigate, G = got it, R = review again
      </p>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Mastery progress</span>
          <span>
            {masteredCount} mastered of {totalCount}
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </section>
  );
}
