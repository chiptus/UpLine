import { useRouteContext } from "@tanstack/react-router";
import {
  type FestivalPhase,
  getEffectiveFestivalPhase,
  phaseInputFromEdition,
} from "@/lib/festivalPhase";

export function useFestivalPhase(): { phase: FestivalPhase } {
  const { festival, edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });

  const phase = getEffectiveFestivalPhase(
    phaseInputFromEdition({
      edition,
      timezone: festival.timezone,
      now: new Date(),
    }),
  );

  return { phase };
}
