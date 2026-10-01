import { addDays, format, isValid, parseISO } from "date-fns";
import { convertLocalTimeToUTC } from "@/lib/timeUtils";
import type { RevealLevel } from "@/lib/scheduleReveal";

export type FestivalPhase =
  | "pre-schedule"
  | "planning"
  | "live"
  | "post-festival";

export type FestivalPhaseInput = {
  revealLevel: RevealLevel;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
  now: Date;
};

export type GetEffectiveFestivalPhaseInput = {
  override: FestivalPhase | null;
  derivedInput: FestivalPhaseInput;
};

// The single override rule for the whole app: a non-null override wins over
// every derived case, null falls through to the derived phase. Consumers
// should read this effective phase rather than checking the override
// themselves.
export function getEffectiveFestivalPhase({
  override,
  derivedInput,
}: GetEffectiveFestivalPhaseInput): FestivalPhase {
  return override ?? getFestivalPhase(derivedInput);
}

export function getFestivalPhase({
  revealLevel,
  startDate,
  endDate,
  timezone,
  now,
}: FestivalPhaseInput): FestivalPhase {
  if (revealLevel === "draft") return "pre-schedule";

  const liveStart = startDate
    ? zonedInstant(shiftDayKey(startDate, -1), "00:00:00", timezone)
    : null;
  if (!liveStart || now.getTime() < liveStart.getTime()) return "planning";

  const liveEnd = endDate
    ? zonedInstant(shiftDayKey(endDate, 1), "06:00:00", timezone)
    : null;
  if (!liveEnd || now.getTime() <= liveEnd.getTime()) return "live";

  return "post-festival";
}

/**
 * Minimal edition-like shape {@link phaseInputFromEdition} needs — not a full
 * FestivalEdition row — so callers with a partially-loaded or differently
 * shaped edition can still build phase input.
 */
export type PhaseInputEdition = {
  schedule_reveal_level?: RevealLevel | null;
  start_date?: string | null;
  end_date?: string | null;
  phase_override?: FestivalPhase | null;
};

/**
 * The one place that owns the edition-row -> phase-input defaulting policy
 * (missing reveal level -> "draft", missing dates -> null), so callers never
 * re-decide it independently.
 */
export function phaseInputFromEdition(
  edition: PhaseInputEdition,
  timezone: string,
  now: Date,
): GetEffectiveFestivalPhaseInput {
  return {
    override: edition.phase_override ?? null,
    derivedInput: {
      revealLevel: edition.schedule_reveal_level ?? "draft",
      startDate: edition.start_date ?? null,
      endDate: edition.end_date ?? null,
      timezone,
      now,
    },
  };
}

// Shift a yyyy-MM-dd calendar day by whole days, staying a yyyy-MM-dd string.
// Returns null for an unparseable date so callers degrade instead of throwing.
function shiftDayKey(dateKey: string, delta: number): string | null {
  const date = parseISO(dateKey);
  if (!isValid(date)) return null;
  return format(addDays(date, delta), "yyyy-MM-dd");
}

// The UTC instant for a wall-clock day + time read in the festival timezone,
// via the same fromZonedTime-based helper the display path uses.
function zonedInstant(
  dateKey: string | null,
  time: string,
  timezone: string,
): Date | null {
  if (!dateKey) return null;
  const iso = convertLocalTimeToUTC(`${dateKey} ${time}`, timezone);
  return iso ? new Date(iso) : null;
}
