// PROTOTYPE (timeline nav & filtering) — throwaway, delete with this folder.
import type { TimelineData } from "@/lib/timelineCalculator";
import type { VoteType } from "@/lib/voteConfig";

export interface DayJump {
  key: string;
  label: string;
  start: Date;
}

export interface VariantProps {
  timelineData: TimelineData;
  timezone: string;
  days: DayJump[];
  now: Date | null;
  mountFallback: Date | null;
  voteFilter: VoteType[];
  voteCounts: Partial<Record<VoteType, number>>;
  onToggleVote: (voteType: VoteType) => void;
  onClearVotes: () => void;
}

export function isNowInWindow(
  now: Date | null,
  timelineData: TimelineData,
): now is Date {
  return (
    now !== null &&
    now >= timelineData.festivalStart &&
    now <= timelineData.festivalEnd
  );
}
