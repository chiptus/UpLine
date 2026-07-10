import type { FestivalPhase } from "@/lib/festivalPhase";
import type { MainTab } from "./types";

const DEFAULT_TAB_BY_PHASE: Record<FestivalPhase, MainTab> = {
  "pre-schedule": "sets",
  planning: "sets",
  live: "schedule",
  "post-festival": "sets",
};

export function getDefaultTab(phase: FestivalPhase): MainTab {
  return DEFAULT_TAB_BY_PHASE[phase];
}
