import { useRouteContext } from "@tanstack/react-router";
import {
  type FestivalPhase,
  getEffectiveFestivalPhase,
} from "@/lib/festivalPhase";

export function useFestivalPhase(): { phase: FestivalPhase } {
  const { festival, edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });

  const phase = getEffectiveFestivalPhase({
    override: edition?.phase_override ?? null,
    derivedInput: {
      revealLevel: edition?.schedule_reveal_level ?? "draft",
      startDate: edition?.start_date ?? null,
      endDate: edition?.end_date ?? null,
      timezone: festival.timezone,
      now: new Date(),
    },
  });

  return { phase };
}
