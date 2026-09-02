import { useRef } from "react";
import type { RefObject } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserVotesQuery } from "@/api/voting/useUserVotesQuery";
import { offsetToTime } from "@/lib/timelineCalculator";
import type { TimelineData } from "@/lib/timelineCalculator";
import type { ScheduleDay } from "@/hooks/useScheduleData";
import { getFestivalDayParts } from "@/lib/timeUtils";
import {
  calculateDayBoundaries,
  calculateOverviewViewport,
  fractionToOffset,
} from "@/lib/timelineOverviewGeometry";
import { OverviewStageRow } from "./OverviewStageRow";
import { OverviewViewportWindow } from "./OverviewViewportWindow";
import { useTimelineViewportSize } from "./useTimelineViewportSize";

// Fixed regardless of stage count: rows shrink to fit rather than the map
// growing taller on festivals with many stages (which made it unusably tall
// on mobile).
const MAP_HEIGHT_PX = 64;
const LABEL_HEIGHT_PX = 16;

interface TimelineOverviewProps {
  timelineData: TimelineData;
  scheduleDays: ScheduleDay[];
  timezone: string;
  dayStartHour: number;
  scrollContainerRef: RefObject<HTMLDivElement>;
  onJump: (moment: Date) => void;
}

/**
 * Collapsible mini-map of the full (filtered) edition: one thin row per
 * stage showing set density, day boundary lines, the viewer's voted sets in
 * their vote color, and a draggable window over the strip's visible span.
 * Built entirely from the same `timelineData` the strip renders, so it
 * never shows more (or less) than the strip already does.
 */
export function TimelineOverview({
  timelineData,
  scheduleDays,
  timezone,
  dayStartHour,
  scrollContainerRef,
  onJump,
}: TimelineOverviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { data: userVotes } = useUserVotesQuery(user?.id);

  const viewportSize = useTimelineViewportSize(scrollContainerRef);

  const dayBoundaries = calculateDayBoundaries({
    days: scheduleDays,
    timezone,
    dayStartHour,
    festivalStart: timelineData.festivalStart,
    totalWidth: timelineData.totalWidth,
  });

  const viewportWindow = calculateOverviewViewport({
    scrollLeft: viewportSize.scrollLeft,
    clientWidth: viewportSize.clientWidth,
    totalWidth: timelineData.totalWidth,
  });

  const stageCount = timelineData.stages.length;
  const availableRowsHeight = MAP_HEIGHT_PX - LABEL_HEIGHT_PX - 4;
  const rowHeight = stageCount > 0 ? availableRowsHeight / stageCount : 4;

  return (
    <div
      data-testid="timeline-overview"
      className="mb-4 rounded-lg border border-border bg-popover p-3 backdrop-blur-md"
    >
      <div
        ref={mapRef}
        data-testid="timeline-overview-map"
        className="relative cursor-pointer overflow-hidden rounded-md"
        style={{ height: MAP_HEIGHT_PX }}
        onClick={handleMapClick}
      >
        {dayBoundaries.map((boundary) => {
          const parts = getFestivalDayParts(boundary.date);
          return (
            <div
              key={boundary.date}
              className="pointer-events-none absolute inset-y-0 border-l border-strong"
              style={{ left: `${boundary.leftPercent}%` }}
            >
              {parts && (
                <span className="absolute left-1 top-0 text-[9px] font-medium uppercase leading-none tracking-wide text-subtle-foreground">
                  {parts.weekday} {parts.dayOfMonth}
                </span>
              )}
            </div>
          );
        })}

        {timelineData.stages.map((stage, index) => (
          <OverviewStageRow
            key={stage.name}
            sets={stage.sets}
            totalWidth={timelineData.totalWidth}
            votes={userVotes}
            stageColor={stage.color}
            top={LABEL_HEIGHT_PX + index * rowHeight}
            height={Math.max(0, rowHeight - 1)}
          />
        ))}

        <OverviewViewportWindow
          leftPercent={viewportWindow.leftPercent}
          widthPercent={viewportWindow.widthPercent}
          mapRef={mapRef}
          totalWidth={timelineData.totalWidth}
          scrollContainerRef={scrollContainerRef}
        />
      </div>
    </div>
  );

  function handleMapClick(event: React.MouseEvent<HTMLDivElement>) {
    const map = mapRef.current;
    if (!map) return;

    const rect = map.getBoundingClientRect();
    if (rect.width <= 0) return;

    const fraction = (event.clientX - rect.left) / rect.width;
    const offset = fractionToOffset({
      fraction,
      totalWidth: timelineData.totalWidth,
    });
    onJump(offsetToTime(offset, timelineData.festivalStart));
  }
}
