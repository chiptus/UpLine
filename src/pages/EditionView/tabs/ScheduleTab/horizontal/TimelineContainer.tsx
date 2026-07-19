import { useRef } from "react";
import { TimeScale } from "./TimeScale";
import { StageRow } from "./StageRow";
import { TimelineToolbar } from "./TimelineToolbar";
import type { TimelineData } from "@/lib/timelineCalculator";
import type { ScheduleDay } from "@/hooks/useScheduleData";
import { useTimelineScrollSync } from "@/hooks/useTimelineScrollSync";
import { useTimelineJump } from "@/hooks/useTimelineJump";

interface TimelineContainerProps {
  timelineData: TimelineData;
  timezone: string;
  scheduleDays: ScheduleDay[];
  selectedDay: string;
}

export function TimelineContainer({
  timelineData,
  timezone,
  scheduleDays,
  selectedDay,
}: TimelineContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useTimelineScrollSync({
    scrollContainerRef,
    festivalStart: timelineData.festivalStart,
    timezone,
  });
  const { jumpTo } = useTimelineJump({
    scrollContainerRef,
    festivalStart: timelineData.festivalStart,
  });

  return (
    <>
      <TimelineToolbar
        days={scheduleDays}
        selectedDay={selectedDay}
        timezone={timezone}
        onJumpToDay={jumpTo}
      />
      <div
        ref={scrollContainerRef}
        data-testid="timeline-scroll-container"
        className="overflow-x-auto overflow-y-hidden pb-20"
      >
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
      </div>
    </>
  );
}
