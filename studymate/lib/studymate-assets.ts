import type { EducationLevel, SubjectType } from "@/types";

export type StudyMateAsset = {
  src: string;
  alt: string;
};

const guideAssets = {
  demo: {
    src: "/studymate-assets/guide-demo.png",
    alt: "StudyMate demo guide",
  },
  base: {
    src: "/studymate-assets/guide-base.png",
    alt: "StudyMate guide",
  },
  beginner: {
    src: "/studymate-assets/guide-beginner.png",
    alt: "StudyMate beginner guide",
  },
  advanced: {
    src: "/studymate-assets/guide-advanced.png",
    alt: "StudyMate advanced guide",
  },
  success: {
    src: "/studymate-assets/guide-success.png",
    alt: "StudyMate success guide",
  },
  law: {
    src: "/studymate-assets/guide-law.png",
    alt: "StudyMate law guide",
  },
  engineering: {
    src: "/studymate-assets/guide-engineering.png",
    alt: "StudyMate engineering guide",
  },
  medicine: {
    src: "/studymate-assets/guide-medicine.png",
    alt: "StudyMate medicine guide",
  },
  economics: {
    src: "/studymate-assets/guide-economics.png",
    alt: "StudyMate economics guide",
  },
  neutral: {
    src: "/studymate-assets/guide-neutral.png",
    alt: "StudyMate neutral guide",
  },
} as const;

const badgeAssets = {
  beginner: {
    src: "/studymate-assets/badge-beginner.png",
    alt: "Beginner milestone badge",
  },
  apprentice: {
    src: "/studymate-assets/badge-apprentice.png",
    alt: "Apprentice milestone badge",
  },
  strategist: {
    src: "/studymate-assets/badge-strategist.png",
    alt: "Strategist milestone badge",
  },
  master: {
    src: "/studymate-assets/badge-master.png",
    alt: "Master milestone badge",
  },
} as const;

function normalizeTitle(value: string) {
  return value.toLowerCase().trim();
}

export function getGuideAsset({
  subjectType,
  educationLevel,
  mode,
}: {
  subjectType: SubjectType;
  educationLevel?: EducationLevel | null;
  mode?: "plain" | "story" | "demo";
}): StudyMateAsset {
  if (mode === "demo") {
    return guideAssets.demo;
  }

  if (subjectType === "law") return guideAssets.law;
  if (subjectType === "engineering") return guideAssets.engineering;
  if (subjectType === "medicine") return guideAssets.medicine;
  if (subjectType === "economics") return guideAssets.economics;

  if (educationLevel === "primary" || educationLevel === "secondary") {
    return guideAssets.beginner;
  }

  if (educationLevel === "tertiary") {
    return guideAssets.advanced;
  }

  return guideAssets.base;
}

export function getMilestoneBadgeAsset(milestoneTitle: string): StudyMateAsset {
  const title = normalizeTitle(milestoneTitle);

  if (title.includes("master") || title.includes("champion")) {
    return badgeAssets.master;
  }

  if (title.includes("strategist")) {
    return badgeAssets.strategist;
  }

  if (title.includes("specialist") || title.includes("builder")) {
    return badgeAssets.apprentice;
  }

  return badgeAssets.beginner;
}
