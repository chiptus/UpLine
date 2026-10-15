import {
  computeDateChanges,
  computeDateLabelGeometry,
} from "./timeScaleGeometry";
import { DateBand } from "./DateBand";
import { HourMarkers } from "./HourMarkers";
import type { FestivalDayConfig } from "@/lib/timeUtils";

interface TimeScaleProps {
  timeSlots: Date[];
  totalWidth: number;
  dayConfig: FestivalDayConfig;
  scrollLeft: number;
}

export function TimeScale({
  timeSlots,
  totalWidth,
  dayConfig,
  scrollLeft,
}: TimeScaleProps) {
  // The axis is continuous clock time, so bands split at real midnight; the
  // festival-day cutoff would label 02:00 Saturday as Friday under Saturday's hour markers.
  const dateChanges = computeDateChanges(timeSlots, {
    timezone: dayConfig.timezone,
    dayEndHour: 0,
  });
  const geometry = computeDateLabelGeometry(
    dateChanges,
    scrollLeft,
    totalWidth,
  );

  return (
    <div className="relative" style={{ minWidth: totalWidth }}>
      <DateBand
        dateChanges={dateChanges}
        geometry={geometry}
        totalWidth={totalWidth}
        timezone={dayConfig.timezone}
      />
      <HourMarkers timeSlots={timeSlots} timezone={dayConfig.timezone} />
    </div>
  );
}
