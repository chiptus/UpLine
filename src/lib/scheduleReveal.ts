import type { Database } from "@/integrations/supabase/types";

export type RevealLevel = Database["public"]["Enums"]["schedule_reveal_level"];

const ORDER: Record<RevealLevel, number> = {
  draft: 0,
  days: 1,
  stages: 2,
  full: 3,
};

export function isAtLeast(level: RevealLevel, threshold: RevealLevel): boolean {
  return ORDER[level] >= ORDER[threshold];
}

export function canShowDay(level: RevealLevel): boolean {
  return isAtLeast(level, "days");
}

export function canShowStage(level: RevealLevel): boolean {
  return isAtLeast(level, "stages");
}

export function canShowTime(level: RevealLevel): boolean {
  return isAtLeast(level, "full");
}

export type MaskableSet = {
  time_start: string | null;
  time_end: string | null;
  stage_id: string | null;
};

export function maskSetForReveal<T extends MaskableSet>(
  set: T,
  level: RevealLevel,
): T {
  if (level === "full") return set;

  return {
    ...set,
    stage_id: canShowStage(level) ? set.stage_id : null,
    time_start: canShowDay(level) ? set.time_start : null,
    time_end: canShowTime(level) ? set.time_end : null,
  };
}
