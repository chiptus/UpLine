import { useRef, useState } from "react";
import { TimeScaleContainer } from "./TimeScaleContainer";
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
import { useScrollLeft } from "./useScrollLeft";

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
  const scrollLeft = useScrollLeft(scrollContainerRef);

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
      <TimeScaleContainer
        timelineData={timelineData}
        timezone={timezone}
        scrollLeft={scrollLeft}
      />

      <div className="relative">
        <StageLabels stages={timelineData.stages} />
        <div
          ref={scrollContainerRef}
          data-testid="timeline-scroll-container"
          className="overflow-x-auto overflow-y-hidden pb-20"
        >
          <div className="relative">
            <div className="space-y-12 mt-12">
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
