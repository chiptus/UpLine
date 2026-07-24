import {
  type FestivalPhase,
  getEffectiveFestivalPhase,
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
  const phase = getEffectiveFestivalPhase({
    override: edition.phase_override,
    derivedInput: {
      revealLevel: edition.schedule_reveal_level,
      startDate: edition.start_date,
      endDate: edition.end_date,
      timezone,
      now,
    },
  });
  return phase === "live" && canShowTime(edition.schedule_reveal_level);
}
