// PROTOTYPE (timeline nav & filtering) — throwaway, delete with this folder.
//
// Variant A — "Slim jump bar" (the agreed design, literal):
// sticky slim bar of ghost day buttons + a Now pill above the strip, smooth
// scrolling on jumps, my-vote chips inside the collapsed filter panel.
import { useRef } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrototypeCanvas } from "./PrototypeCanvas";
import { PrototypeFilters } from "./PrototypeFilters";
import { VoteChips } from "./VoteChips";
import { useScrollToUrl } from "./useScrollToUrl";
import { isNowInWindow, type VariantProps } from "./types";

export function VariantSlimBar({
  timelineData,
  timezone,
  days,
  now,
  mountFallback,
  voteFilter,
  onToggleVote,
  onClearVotes,
}: VariantProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { jumpToCenter, jumpToLeftEdge } = useScrollToUrl({
    scrollRef,
    festivalStart: timelineData.festivalStart,
    timezone,
    smooth: true,
    mountFallbackLeftEdge: mountFallback,
  });

  const showNow = isNowInWindow(now, timelineData);

  return (
    <div className="space-y-4">
      <div className="sticky top-2 z-30">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-purple-400/20 bg-purple-950/80 px-2 py-1.5 backdrop-blur">
          <PrototypeFilters
            voteChips={
              <VoteChips selected={voteFilter} onToggle={onToggleVote} />
            }
            voteFilterCount={voteFilter.length}
            onClearVotes={onClearVotes}
          />
          <span className="mr-1 text-xs uppercase tracking-wide text-purple-400">
            Jump to
          </span>
          {days.map((day) => (
            <Button
              key={day.key}
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-purple-200 hover:bg-purple-600/40 hover:text-white"
              onClick={() => jumpToLeftEdge(day.start)}
            >
              {day.label}
            </Button>
          ))}
          {showNow && (
            <Button
              size="sm"
              className="ml-auto h-7 bg-fuchsia-600 px-3 text-white hover:bg-fuchsia-500"
              onClick={() => jumpToCenter(now)}
            >
              <Clock className="mr-1 h-3.5 w-3.5" />
              Now
            </Button>
          )}
        </div>
      </div>

      <PrototypeCanvas
        timelineData={timelineData}
        timezone={timezone}
        scrollRef={scrollRef}
        now={now}
        nowTreatment="line"
      />
    </div>
  );
}
