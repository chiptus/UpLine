// PROTOTYPE (timeline nav & filtering) — throwaway, delete with this folder.
//
// Variant B — "Segmented rail + inline chips":
// a segmented day control that highlights the day currently at the viewport
// center (nav shows where you ARE), instant jumps, and my-vote chips with
// per-vote counts always visible in a row above the strip — testing whether
// "my schedule" (Must Go + Interested) works as a two-tap primary use case.
import { useCallback, useRef, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { PrototypeCanvas } from "./PrototypeCanvas";
import { PrototypeFilters } from "./PrototypeFilters";
import { VoteChips } from "./VoteChips";
import { useScrollToUrl } from "./useScrollToUrl";
import { isNowInWindow, type VariantProps } from "./types";
import { cn } from "@/lib/utils";

export function VariantSegmented({
  timelineData,
  timezone,
  days,
  now,
  mountFallback,
  voteFilter,
  voteCounts,
  onToggleVote,
  onClearVotes,
}: VariantProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);

  const handleCenterChange = useCallback(
    (center: Date) => {
      setActiveDayKey(formatInTimeZone(center, timezone, "yyyy-MM-dd"));
    },
    [timezone],
  );

  const { jumpToCenter, jumpToLeftEdge } = useScrollToUrl({
    scrollRef,
    festivalStart: timelineData.festivalStart,
    timezone,
    smooth: false,
    mountFallbackLeftEdge: mountFallback,
    onCenterChange: handleCenterChange,
  });

  const showNow = isNowInWindow(now, timelineData);

  return (
    <div className="space-y-4">
      <PrototypeFilters
        voteFilterCount={voteFilter.length}
        onClearVotes={onClearVotes}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-lg bg-white/10 p-1">
          {days.map((day) => (
            <button
              key={day.key}
              type="button"
              className={cn(
                "rounded-md px-4 py-1.5 text-sm transition-colors",
                activeDayKey === day.key
                  ? "bg-purple-600 text-white shadow"
                  : "text-purple-300 hover:text-white",
              )}
              onClick={() => jumpToLeftEdge(day.start)}
            >
              {day.label}
            </button>
          ))}
          {showNow && (
            <>
              <div className="mx-1 h-5 w-px bg-white/20" />
              <button
                type="button"
                className="rounded-md bg-fuchsia-600/90 px-4 py-1.5 text-sm text-white hover:bg-fuchsia-500"
                onClick={() => jumpToCenter(now)}
              >
                Now
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-purple-400">
            My votes
          </span>
          <VoteChips
            selected={voteFilter}
            onToggle={onToggleVote}
            counts={voteCounts}
          />
        </div>
      </div>

      <PrototypeCanvas
        timelineData={timelineData}
        timezone={timezone}
        scrollRef={scrollRef}
        now={now}
        nowTreatment="bubble"
      />
    </div>
  );
}
