"use client";

import { Loader2, Send } from "lucide-react";

type LoadingStage = "idle" | "analysing" | "searching" | "structuring";

type QuestionInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loadingStage?: LoadingStage;
  loading?: boolean;
};

export default function QuestionInput({
  value,
  onChange,
  onSubmit,
  loadingStage = "idle",
  loading = false,
}: QuestionInputProps) {
  const length = value.length;
  const stageLabel =
    loadingStage === "analysing"
      ? "Analysing question..."
      : loadingStage === "searching"
        ? "Searching material..."
        : loadingStage === "structuring"
          ? "Structuring answer..."
          : "Practice Answer";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <label className="block text-sm font-semibold text-gray-950" htmlFor="past-question-input">
        Answer an exam-style question
      </label>

      <textarea
        id="past-question-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        minLength={0}
        placeholder="Paste a past exam question, or write the topic you want to practice from this material."
        className="mt-3 min-h-[150px] w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-7 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-300 focus:bg-white"
      />

      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>Tip: Story Mode gives scenario questions. Plain Mode gives direct exam questions.</span>
        <span>{length} characters</span>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading || !value.trim()}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? stageLabel : "Improve My Answer"}
      </button>
    </section>
  );
}
