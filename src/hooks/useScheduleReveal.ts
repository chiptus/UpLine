import { useRouteContext } from "@tanstack/react-router";
import {
  type MaskableSet,
  type RevealLevel,
  canShowDay,
  canShowStage,
  canShowTime,
  maskSetForReveal,
} from "@/lib/scheduleReveal";

export function useScheduleReveal() {
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const level: RevealLevel = edition?.schedule_reveal_level ?? "draft";

  return {
    level,
    canShowDay: canShowDay(level),
    canShowStage: canShowStage(level),
    canShowTime: canShowTime(level),
    maskSet<T extends MaskableSet>(set: T): T {
      return maskSetForReveal(set, level);
    },
  };
}
