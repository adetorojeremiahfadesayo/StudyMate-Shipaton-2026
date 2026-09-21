"use client";

import { Loader2, Sparkles } from "lucide-react";

type TopicListInputProps = {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  loading?: boolean;
  completedCount?: number;
  totalCount?: number;
};

function countTopics(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
}

export default function TopicListInput({
  value,
  onChange,
  onGenerate,
  loading = false,
  completedCount = 0,
  totalCount = 0,
}: TopicListInputProps) {
  const topicCount = totalCount || countTopics(value);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <label className="block text-sm font-semibold text-gray-950" htmlFor="aoc-topics">
        Enter topics one per line
      </label>

      <textarea
        id="aoc-topics"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Enter topics one per line, for example:\nDoctrine of frustration\nPromissory estoppel\nPrivity of contract`}
        className="mt-3 min-h-[180px] w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-7 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-300 focus:bg-white"
      />

      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>{topicCount} topics detected</span>
        <span>
          {completedCount} of {topicCount || totalCount} topics complete
        </span>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 transition-all duration-500"
          style={{
            width: `${topicCount > 0 ? Math.min(100, Math.round((completedCount / topicCount) * 100)) : 0}%`,
          }}
        />
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={loading || topicCount === 0}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? `Generating answers for ${topicCount} topics...` : "Generate Answers"}
      </button>

      <p className="mt-3 text-xs text-gray-400">
        Tip: Copy topics directly from your syllabus or past paper cover sheet for best results.
      </p>
    </section>
  );
}
