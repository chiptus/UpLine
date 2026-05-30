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

export function canShowDay(level: RevealLevel, isAdmin: boolean): boolean {
  return isAdmin || isAtLeast(level, "days");
}

export function canShowStage(level: RevealLevel, isAdmin: boolean): boolean {
  return isAdmin || isAtLeast(level, "stages");
}

export function canShowTime(level: RevealLevel, isAdmin: boolean): boolean {
  return isAdmin || isAtLeast(level, "full");
}

export type MaskableSet = {
  time_start: string | null;
  time_end: string | null;
  stage_id: string | null;
};

export function maskSetForReveal<T extends MaskableSet>(
  set: T,
  level: RevealLevel,
  isAdmin: boolean,
): T {
  if (isAdmin || level === "full") return set;

  return {
    ...set,
    stage_id: canShowStage(level, isAdmin) ? set.stage_id : null,
    time_start: canShowDay(level, isAdmin) ? set.time_start : null,
    time_end: canShowTime(level, isAdmin) ? set.time_end : null,
  };
}
