import { useEffect, useRef, useState } from "react";
import { TimeScale } from "./TimeScale";
import { StageRow } from "./StageRow";
import { StageLabels } from "./StageLabels";
import { TimelineToolbar } from "./TimelineToolbar";
import { TimelineOverview } from "./TimelineOverview";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";
import {
  timeToOffset,
  type ScheduleWindow,
  type TimelineData,
} from "@/lib/timelineCalculator";
import { isNowWithinFestivalWindow } from "@/lib/timelineMountMoment";
import type { ScheduleDay } from "@/hooks/useScheduleData";
import { useTimelineScrollSync } from "@/hooks/useTimelineScrollSync";
import { jumpToTimelineMoment } from "@/lib/timelineDayJump";
import { useActiveTimelineDay } from "@/hooks/useActiveTimelineDay";
// PROTOTYPE: chrome-variant exploration (see ../../../prototype/)
import { useChromeVariant } from "../../../prototype/chromeVariant";

interface TimelineContainerProps {
  timelineData: TimelineData;
  timezone: string;
  scheduleDays: ScheduleDay[];
  selectedDay: string;
  scheduleWindow: ScheduleWindow | null;
  now: Date;
}

export function TimelineContainer({
  timelineData,
  timezone,
  scheduleDays,
  selectedDay,
  scheduleWindow,
  now,
}: TimelineContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  // PROTOTYPE: non-current variants lift the time scale out of the scroller
  // into a sticky header, synced horizontally via transform
  const variant = useChromeVariant();
  const stickyHeader = variant !== "current";
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    if (!stickyHeader) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    function handleScroll() {
      setScrollLeft(container?.scrollLeft ?? 0);
    }
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [stickyHeader]);

  useTimelineScrollSync({
    scrollContainerRef,
    festivalStart: timelineData.festivalStart,
    scheduleWindow,
    timezone,
    now,
  });
  const activeDay = useActiveTimelineDay({
    scrollContainerRef,
    days: scheduleDays,
    timezone,
    festivalStart: timelineData.festivalStart,
  });

  function jumpTo(moment: Date, align: "center" | "start" = "center") {
    const container = scrollContainerRef.current;
    if (container) {
      jumpToTimelineMoment(container, timelineData.festivalStart, moment, {
        align,
      });
    }
  }

  // Gated on the unfiltered scheduleWindow so a stage/time filter can't hide these.
  const isNowInFestivalWindow =
    scheduleWindow !== null &&
    isNowWithinFestivalWindow(now, scheduleWindow.start, scheduleWindow.end);
  const showNowButton = isNowInFestivalWindow;
  const showNowIndicator = isNowInFestivalWindow;

  return (
    <>
      <TimelineToolbar
        days={scheduleDays}
        selectedDay={selectedDay}
        activeDay={activeDay}
        timezone={timezone}
        onJumpToDay={(moment) => jumpTo(moment, "start")}
        isOverviewExpanded={isOverviewExpanded}
        onToggleOverview={() => setIsOverviewExpanded((prev) => !prev)}
        showNowButton={showNowButton}
        onJumpToNow={() => jumpTo(now)}
      />
      {isOverviewExpanded && (
        <TimelineOverview
          timelineData={timelineData}
          scheduleDays={scheduleDays}
          timezone={timezone}
          scrollContainerRef={scrollContainerRef}
          onJump={(moment) => jumpTo(moment, "center")}
        />
      )}
      {stickyHeader && (
        <div className="sticky top-[116px] md:top-[136px] z-30 h-20 overflow-hidden rounded-b-lg bg-gray-900/85 backdrop-blur-md">
          <div
            style={{
              transform: `translateX(-${scrollLeft}px)`,
              minWidth: timelineData.totalWidth,
            }}
          >
            <TimeScale
              timeSlots={timelineData.timeSlots}
              totalWidth={timelineData.totalWidth}
              scrollContainerRef={scrollContainerRef}
              timezone={timezone}
            />
          </div>
        </div>
      )}
      <div className="relative">
        <StageLabels
          stages={timelineData.stages}
          className={stickyHeader ? "-top-6" : undefined}
        />
        <div
          ref={scrollContainerRef}
          data-testid="timeline-scroll-container"
          className="overflow-x-auto overflow-y-hidden pb-20"
        >
          <div className="relative">
            {!stickyHeader && (
              <TimeScale
                timeSlots={timelineData.timeSlots}
                totalWidth={timelineData.totalWidth}
                scrollContainerRef={scrollContainerRef}
                timezone={timezone}
              />
            )}

            <div
              className={stickyHeader ? "space-y-12 mt-10" : "space-y-12 mt-28"}
            >
              {timelineData.stages.map((stage) => (
                <StageRow
                  key={stage.name}
                  stage={stage}
                  totalWidth={timelineData.totalWidth}
                  timezone={timezone}
                />
              ))}
            </div>

            {showNowIndicator && (
              <CurrentTimeIndicator
                left={timeToOffset(now, timelineData.festivalStart)}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
