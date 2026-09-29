import type { Database } from "@/integrations/supabase/types";
import { formatDayOnly, formatTimeRange } from "@/lib/timeUtils";

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

export type RevealableSet = {
  time_start: string | null;
  time_end: string | null;
  status: string;
  stage_id: string | null;
};

export type RevealLabels = {
  dayLabel?: string;
  timeLabel?: string;
  stageId: string | null;
};

/**
 * The single source of a Set's day/time/stage display decision for a given
 * reveal level: dayLabel and timeLabel are mutually exclusive (a full time
 * range once time is revealed, otherwise a day-only label once day is
 * revealed, otherwise neither), and stageId is nulled below stage-level
 * reveal. A "tba" status set shows "<day> · TBA" / "Time TBA" instead of its
 * (often placeholder) time_start.
 */
export function revealLabels(
  set: RevealableSet,
  level: RevealLevel,
  timezone: string | undefined,
  use24Hour: boolean,
): RevealLabels {
  const stageId = canShowStage(level) ? set.stage_id : null;
  const isTba = set.status === "tba";

  if (canShowTime(level) && !isTba) {
    const timeLabel = formatTimeRange(
      set.time_start,
      set.time_end,
      use24Hour,
      timezone,
    );
    return timeLabel ? { timeLabel, stageId } : { stageId };
  }

  if (!canShowDay(level)) return { stageId };

  const day = formatDayOnly(set.time_start, timezone);
  if (!day) return isTba ? { dayLabel: "Time TBA", stageId } : { stageId };
  return { dayLabel: isTba ? `${day} · TBA` : day, stageId };
}

/** The one line of text a Set card shows for its schedule, or undefined if nothing should be shown yet. */
export function scheduleLabel(
  labels: Pick<RevealLabels, "dayLabel" | "timeLabel">,
): string | undefined {
  return labels.dayLabel ?? labels.timeLabel;
}
