"use client";

import { supabase } from "@/lib/supabase";
import { getLearningProfileLabel, normalizeEducationLevel } from "@/lib/learning-profile";
import type { LearningMetadata } from "@/lib/learning-profile";

export async function awardStudyXp(delta: number) {
  if (!Number.isFinite(delta) || delta <= 0) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const currentXp = Number(user.user_metadata?.study_xp ?? 0);
  const nextXp = Math.max(0, Math.floor(currentXp + delta));
  const currentMilestone = getLearningProfileLabel({
    discipline: typeof user.user_metadata?.discipline === "string" ? user.user_metadata.discipline : null,
    education_level:
      typeof user.user_metadata?.education_level === "string" ? user.user_metadata.education_level : null,
    study_xp: nextXp,
  });
  const metadata: LearningMetadata = {
    discipline: typeof user.user_metadata?.discipline === "string" ? user.user_metadata.discipline : null,
    education_level: normalizeEducationLevel(user.user_metadata?.education_level) ?? "tertiary",
    study_xp: nextXp,
    study_rank: currentMilestone.milestone,
  };

  const { error } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (error) {
    return { xp: nextXp, error: error.message };
  }

  return {
    xp: nextXp,
    milestone: currentMilestone,
  };
}
