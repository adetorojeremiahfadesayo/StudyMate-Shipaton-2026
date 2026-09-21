import type { EducationLevel } from "@/types";

export const educationOptions = [
  { value: "primary", label: "Primary", description: "Younger learners who need simple, guided explanations." },
  { value: "secondary", label: "Secondary", description: "School students who need clear, exam-ready explanations." },
  { value: "tertiary", label: "Tertiary", description: "College and university learners who need deeper analysis." },
] as const;

export type LearningMetadata = {
  discipline?: string | null;
  education_level?: string | null;
  study_xp?: number | null;
  study_rank?: string | null;
};

export function isEducationLevel(value: string): value is EducationLevel {
  return educationOptions.some((option) => option.value === value);
}

export function normalizeEducationLevel(value: unknown): EducationLevel | null {
  return typeof value === "string" && isEducationLevel(value) ? value : null;
}

function clampRankIndex(xp: number, breaks: number[]) {
  return breaks.findIndex((threshold) => xp < threshold);
}

export function getEducationMeta(level: EducationLevel | null | undefined) {
  const match = educationOptions.find((option) => option.value === level);
  return match ?? educationOptions[2];
}

export function getStudyMilestone(xp: number, educationLevel: EducationLevel | null | undefined, subjectLabel?: string) {
  const safeXp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  const safeSubjectLabel = subjectLabel
    ? subjectLabel.charAt(0).toUpperCase() + subjectLabel.slice(1)
    : "Study";

  const tiersByLevel: Record<EducationLevel, { breaks: number[]; titles: string[] }> = {
    primary: {
      breaks: [120, 320, 640],
      titles: ["Explorer", "Builder", "Achiever", "Champion"],
    },
    secondary: {
      breaks: [160, 420, 820],
      titles: ["Scholar", "Specialist", "Strategist", "Champion"],
    },
    tertiary: {
      breaks: [220, 560, 1100],
      titles: ["Apprentice", "Specialist", "Strategist", "Master"],
    },
  };

  const level = educationLevel ?? "tertiary";
  const profile = tiersByLevel[level];
  const tierIndex = clampRankIndex(safeXp, profile.breaks);
  const title = profile.titles[Math.max(0, tierIndex < 0 ? profile.titles.length - 1 : tierIndex)];
  const milestone = `${safeSubjectLabel} ${title}`;

  const currentThreshold = tierIndex <= 0 ? 0 : profile.breaks[tierIndex - 1] ?? 0;
  const nextLevelThreshold =
    tierIndex >= 0 && tierIndex < profile.breaks.length ? profile.breaks[tierIndex] : profile.breaks.at(-1) ?? safeXp;

  return {
    xp: safeXp,
    educationLevel: level,
    milestone,
    title,
    currentThreshold,
    nextThreshold: nextLevelThreshold,
    progressToNext:
      nextLevelThreshold > currentThreshold
        ? Math.min(100, Math.round(((safeXp - currentThreshold) / (nextLevelThreshold - currentThreshold)) * 100))
        : 100,
    label: `${milestone} • ${safeXp} XP`,
  };
}

export function getEducationGuidance(educationLevel: EducationLevel | null | undefined) {
  const level = educationLevel ?? "tertiary";

  if (level === "primary") {
    return {
      audience: "Primary",
      promptStyle: "Use very simple language, short steps, vivid examples, and friendly guidance.",
      quizStyle: "Keep questions short, concrete, and reassuring.",
      storyStyle: "Make the story playful, safe, and easy to follow.",
    };
  }

  if (level === "secondary") {
    return {
      audience: "Secondary",
      promptStyle: "Use clear language, moderate detail, and exam-focused explanations.",
      quizStyle: "Use school-exam level questions with direct prompts and helpful structure.",
      storyStyle: "Keep the story lively but still firmly grounded in the material.",
    };
  }

  return {
    audience: "Tertiary",
    promptStyle: "Use formal academic language, fuller analysis, and complete exam-ready structure.",
    quizStyle: "Use university-level questions, deeper analysis, and realistic examiner expectations.",
    storyStyle: "Keep the story professional and case-driven, with strong analytical depth.",
  };
}

export function getLearningProfileLabel(metadata: LearningMetadata | null | undefined) {
  const xp = Number(metadata?.study_xp ?? 0);
  const educationLevel = normalizeEducationLevel(metadata?.education_level) ?? "tertiary";
  const discipline = metadata?.discipline
    ? metadata.discipline.charAt(0).toUpperCase() + metadata.discipline.slice(1)
    : "Study";
  return getStudyMilestone(xp, educationLevel, discipline);
}
