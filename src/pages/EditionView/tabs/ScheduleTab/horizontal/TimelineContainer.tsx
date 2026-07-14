import { useRef } from "react";
import { TimeScale } from "./TimeScale";
import { StageRow } from "./StageRow";
import { TimelineToolbar } from "./TimelineToolbar";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";
import { timeToOffset, type TimelineData } from "@/lib/timelineCalculator";
import { isNowWithinFestivalWindow } from "@/lib/timelineMountMoment";
import type { ScheduleDay } from "@/hooks/useScheduleData";
import { useTimelineScrollSync } from "@/hooks/useTimelineScrollSync";

interface TimelineContainerProps {
  timelineData: TimelineData;
  timezone: string;
  scheduleDays: ScheduleDay[];
  selectedDay: string;
  now: Date;
}

export function TimelineContainer({
  timelineData,
  timezone,
  scheduleDays,
  selectedDay,
  now,
}: TimelineContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { jumpTo } = useTimelineScrollSync({
    scrollContainerRef,
    festivalStart: timelineData.festivalStart,
    festivalEnd: timelineData.festivalEnd,
    timezone,
    now,
  });

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
        showNowButton={showNowIndicator}
        onJumpToNow={() => jumpTo(now)}
      />
      <div
        ref={scrollContainerRef}
        data-testid="timeline-scroll-container"
        className="overflow-x-auto overflow-y-hidden pb-20"
      >
        <div className="relative">
          {/* Time Scale */}
          <TimeScale
            timeSlots={timelineData.timeSlots}
            totalWidth={timelineData.totalWidth}
            scrollContainerRef={scrollContainerRef}
            timezone={timezone}
          />

          {/* Stage Rows */}
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
