import { useRouteContext } from "@tanstack/react-router";
import {
  type RevealableSet,
  type RevealLabels,
  type RevealLevel,
  canShowDay,
  canShowStage,
  canShowTime,
  computeRevealLabels,
} from "@/lib/scheduleReveal";

export function useScheduleReveal() {
  const { edition, festival } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const level: RevealLevel = edition.schedule_reveal_level ?? "draft";

  return {
    level,
    canShowDay: canShowDay(level),
    canShowStage: canShowStage(level),
    canShowTime: canShowTime(level),
    revealLabels(
      set: RevealableSet,
      { use24Hour }: { use24Hour: boolean },
    ): RevealLabels {
      return computeRevealLabels(set, {
        level,
        timezone: festival.timezone,
        use24Hour,
      });
    },
  };
}
