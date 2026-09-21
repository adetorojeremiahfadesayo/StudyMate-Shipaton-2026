import type {
  ConfidenceLevel,
  FlashcardStatus,
  KeyPoint,
  OcrStatus,
  SubjectType,
  WikiPageType,
} from "@/types";

const subjectMeta: Record<SubjectType, { label: string; badge: string; panel: string }> = {
  law: {
    label: "Law",
    badge: "bg-violet-100 text-violet-700 ring-violet-200",
    panel: "border-violet-200 bg-violet-50",
  },
  engineering: {
    label: "Engineering",
    badge: "bg-blue-100 text-blue-700 ring-blue-200",
    panel: "border-blue-200 bg-blue-50",
  },
  medicine: {
    label: "Medicine",
    badge: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    panel: "border-emerald-200 bg-emerald-50",
  },
  economics: {
    label: "Economics",
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    panel: "border-amber-200 bg-amber-50",
  },
  other: {
    label: "Other",
    badge: "bg-gray-100 text-gray-700 ring-gray-200",
    panel: "border-gray-200 bg-gray-50",
  },
};

const ocrMeta: Record<OcrStatus, { label: string; badge: string }> = {
  queued: { label: "Queued", badge: "bg-slate-100 text-slate-700 ring-slate-200" },
  pending: { label: "Pending", badge: "bg-gray-100 text-gray-700 ring-gray-200" },
  processing: { label: "Processing", badge: "bg-amber-100 text-amber-800 ring-amber-200" },
  complete: { label: "Ready", badge: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  failed: { label: "Failed", badge: "bg-rose-100 text-rose-700 ring-rose-200" },
};

const wikiTypeMeta: Record<
  WikiPageType,
  { label: string; badge: string; border: string; ring: string; accent: string }
> = {
  principle: {
    label: "Principle",
    badge: "bg-violet-100 text-violet-700 ring-violet-200",
    border: "border-violet-500",
    ring: "ring-violet-200",
    accent: "bg-violet-500",
  },
  case: {
    label: "Case",
    badge: "bg-blue-100 text-blue-700 ring-blue-200",
    border: "border-blue-500",
    ring: "ring-blue-200",
    accent: "bg-blue-500",
  },
  formula: {
    label: "Formula",
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    border: "border-amber-500",
    ring: "ring-amber-200",
    accent: "bg-amber-500",
  },
  maxim: {
    label: "Maxim",
    badge: "bg-pink-100 text-pink-700 ring-pink-200",
    border: "border-pink-500",
    ring: "ring-pink-200",
    accent: "bg-pink-500",
  },
  definition: {
    label: "Definition",
    badge: "bg-teal-100 text-teal-700 ring-teal-200",
    border: "border-teal-500",
    ring: "ring-teal-200",
    accent: "bg-teal-500",
  },
  concept: {
    label: "Concept",
    badge: "bg-gray-100 text-gray-700 ring-gray-200",
    border: "border-gray-500",
    ring: "ring-gray-200",
    accent: "bg-gray-500",
  },
};

const keyPointMeta: Record<
  KeyPoint["type"],
  { label: string; badge: string; border: string; accent: string }
> = {
  principle: {
    label: "Principle",
    badge: "bg-violet-100 text-violet-700 ring-violet-200",
    border: "border-violet-600",
    accent: "bg-violet-600",
  },
  case: {
    label: "Case",
    badge: "bg-blue-100 text-blue-700 ring-blue-200",
    border: "border-blue-600",
    accent: "bg-blue-600",
  },
  formula: {
    label: "Formula",
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    border: "border-amber-600",
    accent: "bg-amber-600",
  },
  maxim: {
    label: "Maxim",
    badge: "bg-pink-100 text-pink-700 ring-pink-200",
    border: "border-pink-600",
    accent: "bg-pink-600",
  },
  definition: {
    label: "Definition",
    badge: "bg-teal-100 text-teal-700 ring-teal-200",
    border: "border-teal-600",
    accent: "bg-teal-600",
  },
  concept: {
    label: "Concept",
    badge: "bg-gray-100 text-gray-700 ring-gray-200",
    border: "border-gray-600",
    accent: "bg-gray-600",
  },
};

const flashcardStatusMeta: Record<
  FlashcardStatus,
  { label: string; badge: string; progress: string }
> = {
  review: {
    label: "Review",
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    progress: "bg-amber-500",
  },
  mastered: {
    label: "Mastered",
    badge: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    progress: "bg-emerald-500",
  },
};

const confidenceMeta: Record<
  ConfidenceLevel,
  { label: string; badge: string; text: string }
> = {
  high: {
    label: "Verified",
    badge: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    text: "green",
  },
  medium: {
    label: "Verify independently",
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    text: "amber",
  },
  low: {
    label: "Could not fully verify",
    badge: "bg-rose-100 text-rose-700 ring-rose-200",
    text: "rose",
  },
};

export function getSubjectMeta(subjectType: SubjectType | string | null | undefined) {
  const key = (subjectType && subjectType in subjectMeta ? subjectType : "other") as SubjectType;
  return subjectMeta[key];
}

export function getOcrMeta(status: OcrStatus | string | null | undefined) {
  const key = (status && status in ocrMeta ? status : "pending") as OcrStatus;
  return ocrMeta[key];
}

export function getWikiTypeMeta(type: WikiPageType | string | null | undefined) {
  const key = (type && type in wikiTypeMeta ? type : "concept") as WikiPageType;
  return wikiTypeMeta[key];
}

export function getKeyPointMeta(type: KeyPoint["type"] | string | null | undefined) {
  const key = (type && type in keyPointMeta ? type : "definition") as KeyPoint["type"];
  return keyPointMeta[key];
}

export function getFlashcardStatusMeta(status: FlashcardStatus | string | null | undefined) {
  const key = (status && status in flashcardStatusMeta ? status : "review") as FlashcardStatus;
  return flashcardStatusMeta[key];
}

export function getConfidenceMeta(confidence: ConfidenceLevel | string | null | undefined) {
  const key = (confidence && confidence in confidenceMeta ? confidence : "medium") as ConfidenceLevel;
  return confidenceMeta[key];
}

export function formatDate(dateValue: string | Date | null | undefined) {
  if (!dateValue) {
    return "Unknown date";
  }

  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** power;

  return `${value >= 10 || power === 0 ? Math.round(value) : value.toFixed(1)} ${units[power]}`;
}

export function getDisplayName(fullName: string | null | undefined, email: string | null | undefined) {
  if (fullName?.trim()) {
    return fullName.trim();
  }

  if (email?.includes("@")) {
    const handle = email.split("@")[0];
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  }

  return "Student";
}
