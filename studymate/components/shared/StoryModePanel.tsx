"use client";

import Image from "next/image";
import { Flame, Sparkles } from "lucide-react";
import type { AnswerMode, SubjectType } from "@/types";
import { getStoryGuide, type StoryContext } from "@/lib/story-mode";
import { getEducationMeta, getEducationGuidance } from "@/lib/learning-profile";
import type { EducationLevel } from "@/types";
import { getGuideAsset } from "@/lib/studymate-assets";

type StoryModePanelProps = {
  subjectType: SubjectType;
  context: StoryContext;
  mode: AnswerMode;
  onModeChange: (mode: AnswerMode) => void;
  storyXp?: number;
  educationLevel?: EducationLevel;
};

export default function StoryModePanel({
  subjectType,
  context,
  mode,
  onModeChange,
  storyXp = 0,
  educationLevel,
}: StoryModePanelProps) {
  const guide = getStoryGuide(subjectType, context, mode);
  const educationMeta = getEducationMeta(educationLevel);
  const educationGuidance = getEducationGuidance(educationLevel);
  const guideAsset = getGuideAsset({ subjectType, educationLevel, mode });

  return (
    <section className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            <Sparkles className="h-3.5 w-3.5" />
            {guide.modeLabel}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-950">{guide.guideTitle}</h3>
            <p className="mt-1 text-sm text-gray-600">{guide.guideSubtitle}</p>
          </div>
          <div className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            Tailored for {educationMeta.label}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onModeChange("story")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "story"
                  ? "bg-violet-700 text-white shadow-sm"
                  : "border border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
              }`}
            >
              <Flame className="h-4 w-4" />
              Story Mode
            </button>
            <button
              type="button"
              onClick={() => onModeChange("plain")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "plain"
                  ? "bg-gray-950 text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-700 hover:border-violet-200 hover:text-violet-700"
              }`}
            >
              Plain Mode
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-violet-50">
              <Image
                src={guideAsset.src}
                alt={guideAsset.alt}
                width={80}
                height={80}
                className="h-full w-full object-contain"
                priority={mode === "story"}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                <Flame className="h-4 w-4" />
                {guide.avatarLabel}
              </div>
              <p className="text-xs text-gray-500">{educationMeta.label} learning guide</p>
            </div>
          </div>
          <p className="mt-2 max-w-md text-sm leading-6 text-gray-700">{guide.intro}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
            {educationGuidance.promptStyle}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {guide.steps.map((step) => (
              <span key={step} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                {step}
              </span>
            ))}
          </div>
          <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold leading-5 text-violet-800">
            Checkpoint: explain the scene, name the rule, apply the source, then turn it into an exam answer.
          </p>
          <p className="mt-3 text-xs text-gray-500">{guide.xpHint}</p>
          <div className="mt-3 inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            Story XP: {storyXp}
          </div>
        </div>
      </div>
    </section>
  );
}
