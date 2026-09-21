"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Circle, X } from "lucide-react";
import type { QuizQuestion } from "@/types";

type MCQCardProps = {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  correctCount: number;
  answeredCount: number;
  onComplete: (result: {
    selectedAnswer: string;
    isCorrect: boolean;
    score: number;
    maxScore: number;
    question: QuizQuestion;
  }) => void;
};

export default function MCQCard({
  question,
  questionNumber,
  totalQuestions,
  correctCount,
  answeredCount,
  onComplete,
}: MCQCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const options = useMemo(() => question.options ?? [], [question.options]);
  const correctOption = options.find((option) => option.correct);
  const progressPercent = Math.round((questionNumber / totalQuestions) * 100);

  const handleSelect = (label: string) => {
    if (locked) {
      return;
    }

    setSelected(label);
    setLocked(true);
  };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-500">
            Question {questionNumber} of {totalQuestions}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {answeredCount} answered • {correctCount} correct
          </p>
        </div>
        <p className="text-sm font-semibold text-gray-700">
          {correctCount}/{answeredCount || 1} correct
        </p>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-gray-950">{question.question}</h2>

      <div className="mt-6 grid gap-3">
        {options.map((option) => {
          const active = selected === option.label;
          const correct = option.label === question.correct_answer;
          const showCorrect = locked && correct;
          const showWrong = locked && active && !correct;

          return (
            <button
              key={option.label}
              type="button"
              onClick={() => handleSelect(option.label)}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                locked
                  ? correct
                    ? "border-emerald-300 bg-emerald-50"
                    : showWrong
                      ? "border-rose-300 bg-rose-50"
                      : "border-gray-200 bg-white opacity-70"
                  : "border-gray-200 bg-white hover:border-violet-200 hover:bg-violet-50"
              }`}
            >
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700">
                {option.label}
              </span>
              <span className="flex-1 text-sm leading-7 text-gray-800">{option.text}</span>
              {showCorrect ? <Check className="mt-1 h-5 w-5 text-emerald-600" /> : null}
              {showWrong ? <X className="mt-1 h-5 w-5 text-rose-600" /> : null}
              {active && !locked ? <Circle className="mt-1 h-5 w-5 text-violet-600" /> : null}
            </button>
          );
        })}
      </div>

      {locked ? (
        <div className="mt-5 rounded-2xl bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-950">Explanation</p>
          <p className="mt-2 text-sm leading-7 text-gray-700">{question.explanation}</p>
          <p className="mt-3 text-sm text-gray-600">
            Correct answer: <span className="font-semibold text-gray-950">{question.correct_answer}</span>
            {correctOption ? ` - ${correctOption.text}` : ""}
          </p>
          <button
            type="button"
            onClick={() =>
              onComplete({
                selectedAnswer: selected ?? "",
                isCorrect: selected === question.correct_answer,
                score: selected === question.correct_answer ? 1 : 0,
                maxScore: 1,
                question,
              })
            }
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
          >
            Next Question
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
