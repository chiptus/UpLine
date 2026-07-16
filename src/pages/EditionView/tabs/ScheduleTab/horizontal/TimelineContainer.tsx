import { useRef } from "react";
import { TimeScale } from "./TimeScale";
import { StageRow } from "./StageRow";
import { TimelineToolbar } from "./TimelineToolbar";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";
import {
  timeToOffset,
  type ScheduleWindow,
  type TimelineData,
} from "@/lib/timelineCalculator";
import { isNowWithinFestivalWindow } from "@/lib/timelineMountMoment";
import type { ScheduleDay } from "@/hooks/useScheduleData";
import { useTimelineScrollSync } from "@/hooks/useTimelineScrollSync";

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

  const { jumpTo } = useTimelineScrollSync({
    scrollContainerRef,
    festivalStart: timelineData.festivalStart,
    scheduleWindow,
    timezone,
    now,
  });

  // The pill is gated on the UNFILTERED schedule window so an active
  // stage/time filter can't hide it mid-festival as a side effect; the
  // indicator is gated on the rendered strip's own (filtered) bounds, since
  // it can only be drawn meaningfully inside the strip.
  const showNowButton =
    scheduleWindow !== null &&
    isNowWithinFestivalWindow(now, scheduleWindow.start, scheduleWindow.end);
  const showNowIndicator = isNowWithinFestivalWindow(
    now,
    timelineData.festivalStart,
    timelineData.festivalEnd,
  );

  return (
    <>
      <TimelineToolbar
        days={scheduleDays}
        selectedDay={selectedDay}
        timezone={timezone}
        onJumpToDay={jumpTo}
        showNowButton={showNowButton}
        onJumpToNow={() => jumpTo(now)}
      />
      <div
        ref={scrollContainerRef}
        data-testid="timeline-scroll-container"
        className="overflow-x-auto overflow-y-hidden pb-20"
      >
        <div className="relative">
          <TimeScale
            timeSlots={timelineData.timeSlots}
            totalWidth={timelineData.totalWidth}
            scrollContainerRef={scrollContainerRef}
            timezone={timezone}
          />

          <div className="space-y-12 mt-28">
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
    </>
  );
}
