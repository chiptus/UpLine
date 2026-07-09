// PROTOTYPE (timeline nav & filtering) — throwaway, delete this folder when
// the verdicts are captured (see NOTES.md).
//
// Three variants of timeline navigation + my-vote filtering, switchable via
// `?variant=` on the existing schedule/timeline route:
//   a — Slim jump bar (agreed design: ghost day buttons + Now pill, smooth)
//   b — Segmented rail (active-day highlight, instant jumps, inline chips)
//   c — Mini-map (draggable overview strip, compact chips)
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { calculateTimelineData } from "@/lib/timelineCalculator";
import { getFestivalHour } from "@/lib/timeUtils";
import { getVoteConfig, getVoteValue, type VoteType } from "@/lib/voteConfig";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import type { ScheduleDay, ScheduleSet } from "@/hooks/useScheduleData";
import type { Stage } from "@/api/stages/types";
import { useFakeNow } from "./useFakeNow";
import { usePrototypeVotes } from "./usePrototypeVotes";
import { VariantSlimBar } from "./VariantSlimBar";
import { VariantSegmented } from "./VariantSegmented";
import { VariantMinimap } from "./VariantMinimap";
import type { DayJump } from "./types";
import { PrototypeSwitcher } from "@/components/prototype/PrototypeSwitcher";

interface TimelinePrototypeProps {
  variant: "a" | "b" | "c";
  scheduleDays: ScheduleDay[];
  stages: Stage[];
  edition: { start_date: string | null; end_date: string | null };
  timezone: string;
}

export function TimelinePrototype({
  variant,
  scheduleDays,
  stages,
  edition,
  timezone,
}: TimelinePrototypeProps) {
  const {
    day: selectedDay,
    time: selectedTime,
    stages: selectedStages,
  } = useTimelineUrlState("timeline");
  const { getVote, isFake } = usePrototypeVotes();
  const [voteFilter, setVoteFilter] = useState<VoteType[]>([]);

  const now = useFakeNow(
    edition.start_date ? new Date(edition.start_date) : null,
    edition.end_date ? new Date(edition.end_date) : null,
  );

  const timelineData = useMemo(() => {
    if (!edition.start_date || !edition.end_date) return null;

    const selectedVoteValues: number[] = voteFilter.map(getVoteValue);

    function matchesVotes(set: ScheduleSet) {
      if (selectedVoteValues.length === 0) return true;
      const vote = getVote(set.id);
      return vote !== undefined && selectedVoteValues.includes(vote);
    }

    // Same day/time/stage filtering as the production Timeline, plus votes.
    const filteredScheduleDays = scheduleDays.map((day) => {
      if (selectedDay !== "all" && day.date !== selectedDay) {
        return { ...day, stages: [] };
      }

      const filteredStages = day.stages
        .filter(
          (stage) =>
            selectedStages.length === 0 || selectedStages.includes(stage.id),
        )
        .map((stage) => ({
          ...stage,
          sets: stage.sets.filter((set) => {
            if (!matchesVotes(set)) return false;
            if (selectedTime !== "all" && set.startTime) {
              const hour = getFestivalHour(
                set.startTime.toISOString(),
                timezone,
              );
              if (hour === null) return false;
              switch (selectedTime) {
                case "morning":
                  return hour >= 6 && hour < 12;
                case "afternoon":
                  return hour >= 12 && hour < 18;
                case "evening":
                  return hour >= 18 && hour < 24;
                default:
                  return true;
              }
            }
            return true;
          }),
        }));

      return { ...day, stages: filteredStages };
    });

    return calculateTimelineData(
      new Date(edition.start_date),
      new Date(edition.end_date),
      filteredScheduleDays,
      stages,
    );
  }, [
    edition,
    scheduleDays,
    selectedDay,
    selectedTime,
    selectedStages,
    stages,
    timezone,
    voteFilter,
    getVote,
  ]);

  // Jump-bar days derive from the *filtered* strip: nav operates on what is
  // rendered (open sub-question — see NOTES.md).
  const days = useMemo<DayJump[]>(() => {
    return scheduleDays.flatMap((day) => {
      if (selectedDay !== "all" && day.date !== selectedDay) return [];
      let earliest: Date | null = null;
      day.stages.forEach((stage) => {
        stage.sets.forEach((set) => {
          if (set.startTime && (!earliest || set.startTime < earliest)) {
            earliest = set.startTime;
          }
        });
      });
      if (!earliest) return [];
      return [
        {
          key: day.date,
          label: format(parseISO(day.date), "EEE"),
          start: earliest,
        },
      ];
    });
  }, [scheduleDays, selectedDay]);

  const voteCounts = useMemo(() => {
    const counts: Partial<Record<VoteType, number>> = {};
    scheduleDays.forEach((day) => {
      day.stages.forEach((stage) => {
        stage.sets.forEach((set) => {
          const vote = getVote(set.id);
          if (vote === undefined) return;
          const voteType = getVoteConfig(vote);
          if (!voteType) return;
          counts[voteType] = (counts[voteType] ?? 0) + 1;
        });
      });
    });
    return counts;
  }, [scheduleDays, getVote]);

  // Mount precedence after scrollTo (handled in useScrollToUrl): day filter
  // start, else now - 1h context, else festival start.
  const mountFallback = useMemo(() => {
    if (selectedDay !== "all") {
      const day = days.find((d) => d.key === selectedDay);
      if (day) return day.start;
    }
    if (
      timelineData &&
      now &&
      now >= timelineData.festivalStart &&
      now <= timelineData.festivalEnd
    ) {
      return new Date(now.getTime() - 60 * 60_000);
    }
    return null;
  }, [selectedDay, days, timelineData, now]);

  const variantProps = timelineData && {
    timelineData,
    timezone,
    days,
    now,
    mountFallback,
    voteFilter,
    voteCounts,
    onToggleVote: handleToggleVote,
    onClearVotes: handleClearVotes,
  };

  return (
    <>
      {variantProps ? (
        <>
          {variant === "a" && <VariantSlimBar {...variantProps} />}
          {variant === "b" && <VariantSegmented {...variantProps} />}
          {variant === "c" && (
            <VariantMinimap {...variantProps} getVote={getVote} />
          )}
        </>
      ) : (
        <div className="text-center text-purple-300 py-12">
          <p>No sets match the current filters.</p>
        </div>
      )}
      {isFake && (
        <p className="mt-3 text-center text-xs text-purple-400/70">
          Prototype: not logged in, showing fake “my votes” so the chips are
          demoable.
        </p>
      )}
      <PrototypeSwitcher />
    </>
  );

  function handleToggleVote(voteType: VoteType) {
    setVoteFilter((prev) =>
      prev.includes(voteType)
        ? prev.filter((v) => v !== voteType)
        : [...prev, voteType],
    );
  }

  function handleClearVotes() {
    setVoteFilter([]);
  }
}
