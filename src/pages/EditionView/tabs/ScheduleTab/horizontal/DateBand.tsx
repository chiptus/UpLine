import { formatInTimeZone } from "date-fns-tz";
import {
  DAY_GAP_PX,
  type DateChange,
  type DateLabelGeometry,
} from "./timeScaleGeometry";

const dateFormat = "MMMM d";

interface DateBandProps {
  dateChanges: DateChange[];
  geometry: DateLabelGeometry;
  totalWidth: number;
  timezone: string;
}

export function DateBand({
  dateChanges,
  geometry,
  totalWidth,
  timezone,
}: DateBandProps) {
  const { currentDate, nextDate, currentDateStickyLeft, currentDateOpacity } =
    geometry;

  return (
    <div className="relative h-8">
      {dateChanges.map((dateChange, index) => {
        const nextDateChange = dateChanges[index + 1];
        const fullWidth = nextDateChange
          ? nextDateChange.position - dateChange.position
          : totalWidth - dateChange.position;
        const width = fullWidth - DAY_GAP_PX;

        return (
          <div
            key={`date-bg-${index}`}
            className="absolute top-0 h-full bg-purple-900/60 border border-border"
            style={{
              left: `${dateChange.position}px`,
              width: `${width}px`,
            }}
          />
        );
      })}

      <div
        className="absolute top-0 z-10 flex h-full items-center px-3 text-sm font-medium text-foreground whitespace-nowrap"
        style={{
          left: `${currentDate.position + currentDateStickyLeft}px`,
          opacity: currentDateOpacity,
        }}
      >
        {formatInTimeZone(currentDate.date, timezone, dateFormat)}
      </div>

      {geometry.shouldShowUpcoming && nextDate && (
        <div
          className="absolute top-0 z-10 flex h-full items-center px-3 text-sm font-medium text-foreground whitespace-nowrap"
          style={{
            left: `${nextDate.position}px`,
            opacity: geometry.nextDateOpacity,
          }}
        >
          {formatInTimeZone(nextDate.date, timezone, dateFormat)}
        </div>
      )}
    </div>
  );
}
