import {
  type FestivalPhase,
  getEffectiveFestivalPhase,
  phaseInputFromEdition,
} from "@/lib/festivalPhase";
import { canShowTime, type RevealLevel } from "@/lib/scheduleReveal";

export type NowViewEdition = {
  schedule_reveal_level: RevealLevel;
  start_date: string | null;
  end_date: string | null;
  phase_override: FestivalPhase | null;
};

/**
 * Single gate for the "Now" schedule view: the edition is effectively
 * live (override-aware, per festivalPhase's rule that consumers read the
 * effective phase) AND set times are revealed. Shared by the /schedule
 * default redirect and the /schedule/now guard so they can never
 * disagree with the nav tab.
 */
export function canShowNowView(
  edition: NowViewEdition,
  timezone: string,
  now: Date,
): boolean {
  const phase = getEffectiveFestivalPhase(
    phaseInputFromEdition(edition, timezone, now),
  );
  return phase === "live" && canShowTime(edition.schedule_reveal_level);
}
