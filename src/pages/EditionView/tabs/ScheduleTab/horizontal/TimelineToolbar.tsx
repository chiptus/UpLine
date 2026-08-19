import { useRef } from "react";
import { Map } from "lucide-react";
import { DayJumpButtons } from "./DayJumpButtons";
import { NowButton } from "./NowButton";
import { Button } from "@/components/ui/button";
import { ScheduleFilterSheet } from "../ScheduleFilterSheet";
import { VoteFilterChips } from "../VoteFilterChips";
import { ScheduleVoteScopeToggle } from "../ScheduleVoteScopeToggle";
import type { ScheduleDay } from "@/hooks/useScheduleData";
import { useScrollEdgeFade } from "./useScrollEdgeFade";
import { STICKY_TOP_BELOW_TOP_BAR_CLASS } from "@/lib/layout-constants";
import { cn } from "@/lib/utils";

interface TimelineToolbarProps {
  days: ScheduleDay[];
  selectedDay: string;
  activeDay: string | null;
  timezone: string;
  onJumpToDay: (moment: Date) => void;
  isOverviewExpanded: boolean;
  onToggleOverview: () => void;
  showNowButton: boolean;
  onJumpToNow: () => void;
}

// Width of the edge-fade hinting that the day row scrolls further that way.
const SCROLL_FADE_PX = 24;

/**
 * Sticky toolbar above the Timeline strip: day-jump, Now pill, overview
 * toggle, my-vote chips, and the Filters trigger, all in one row.
 */
export function TimelineToolbar({
  days,
  selectedDay,
  activeDay,
  timezone,
  onJumpToDay,
  isOverviewExpanded,
  onToggleOverview,
  showNowButton,
  onJumpToNow,
}: TimelineToolbarProps) {
  const dayRowRef = useRef<HTMLDivElement>(null);

  const visibleDays =
    selectedDay === "all"
      ? days
      : days.filter((day) => day.date === selectedDay);

  const scrollFade = useScrollEdgeFade(dayRowRef, [visibleDays.length]);

  if (visibleDays.length === 0 && !showNowButton) return null;

  const maskImage = `linear-gradient(to right, ${
    scrollFade.left ? "transparent" : "black"
  } 0, black ${SCROLL_FADE_PX}px, black calc(100% - ${SCROLL_FADE_PX}px), ${
    scrollFade.right ? "transparent" : "black"
  } 100%)`;

  return (
    <div
      data-testid="timeline-day-toolbar"
      role="toolbar"
      aria-label="Timeline navigation"
      className={cn(
        "sticky z-40 mb-4 flex items-end gap-1 rounded-lg border border-purple-400/20 bg-gray-900/95 px-2 pb-2.5 pt-2 backdrop-blur-md",
        STICKY_TOP_BELOW_TOP_BAR_CLASS,
      )}
    >
      <div
        ref={dayRowRef}
        role="radiogroup"
        aria-label="Jump to day"
        className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto overflow-y-hidden"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <DayJumpButtons
          days={visibleDays}
          activeDay={activeDay}
          timezone={timezone}
          onJumpToDay={onJumpToDay}
        />
      </div>
      <div className="flex shrink-0 items-center gap-1 self-center border-l border-purple-400/20 pl-1">
        {showNowButton && <NowButton onJumpToNow={onJumpToNow} />}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid="timeline-overview-toggle"
          className="shrink-0 gap-1.5 text-purple-200/60 hover:bg-purple-400/10 hover:text-purple-100"
          aria-expanded={isOverviewExpanded}
          aria-label={isOverviewExpanded ? "Hide overview" : "Show overview"}
          onClick={onToggleOverview}
        >
          <Map className="size-4" />
          <span className="hidden sm:inline">
            {isOverviewExpanded ? "Hide overview" : "Show overview"}
          </span>
        </Button>
        <div className="hidden md:flex items-center gap-1">
          <ScheduleVoteScopeToggle tab="timeline" />
          <VoteFilterChips tab="timeline" />
        </div>
        <ScheduleFilterSheet tab="timeline" />
      </div>
    </div>
  );
}
