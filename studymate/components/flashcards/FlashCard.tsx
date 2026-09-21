"use client";

import ReactMarkdown from "react-markdown";
import type { Flashcard } from "@/types";
import { getKeyPointMeta } from "@/lib/course-utils";

type FlashCardProps = {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
};

export default function FlashCard({ card, isFlipped, onFlip }: FlashCardProps) {
  const meta = getKeyPointMeta(card.key_point_type);

  return (
    <div className="w-full max-w-3xl" style={{ perspective: "1000px" }}>
      <button
        type="button"
        onClick={onFlip}
        className="group relative h-[360px] w-full rounded-3xl outline-none transition hover:shadow-2xl"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.6s",
          transform: isFlipped ? "rotateY(180deg)" : "none",
        }}
      >
        <div
          className="absolute inset-0 flex flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-lg"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}>
            {meta.label}
          </div>

          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-950">{card.front}</h2>
          </div>

          <p className="text-center text-xs font-medium uppercase tracking-[0.24em] text-gray-400">
            Click to flip
          </p>
        </div>

        <div
          className="absolute inset-0 flex flex-col rounded-3xl border border-violet-100 bg-violet-50 p-6 shadow-lg"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}>
            {meta.label}
          </div>

          <div className="mt-4 flex-1 overflow-auto text-left">
            <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-p:text-sm prose-ul:text-sm prose-ol:text-sm">
              <ReactMarkdown>{card.back}</ReactMarkdown>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
