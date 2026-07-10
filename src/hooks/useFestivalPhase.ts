import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import {
  type FestivalPhase,
  getFestivalPhase,
} from "@/lib/festivalPhase";

export function useFestivalPhase(): { phase: FestivalPhase } {
  const { festival, edition } = useFestivalEdition();

  const phase = getFestivalPhase({
    revealLevel: edition?.schedule_reveal_level ?? "draft",
    startDate: edition?.start_date ?? null,
    endDate: edition?.end_date ?? null,
    timezone: festival.timezone,
    now: new Date(),
  });

  return { phase };
}
