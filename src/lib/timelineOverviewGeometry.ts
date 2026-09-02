import { timeToOffset } from "./timelineCalculator";
import { festivalDayStart } from "@/lib/timeUtils";
import type { HorizontalTimelineSet } from "./timelineCalculator";

/**
 * Pure geometry for the overview mini-map. There is exactly one time<->pixel
 * scale in the app (`timeToOffset`/`offsetToTime` in `timelineCalculator`,
 * anchored at `festivalStart`); this module never invents a second one. It
 * only re-expresses those same offsets as a percentage of `totalWidth`, so
 * the mini-map can render at any DOM width and still stay proportional to
 * the full-size strip.
 */

export function offsetToPercent(offset: number, totalWidth: number): number {
  if (totalWidth <= 0) return 0;
  return (offset / totalWidth) * 100;
}

export interface OverviewSetBlock {
  id: string;
  leftPercent: number;
  widthPercent: number;
}

interface CalculateOverviewSetBlocksParams {
  sets: HorizontalTimelineSet[];
  totalWidth: number;
}

/**
 * Proportional position/width of every set that has a computed
 * `horizontalPosition`, for a single stage's overview row.
 */
export function calculateOverviewSetBlocks({
  sets,
  totalWidth,
}: CalculateOverviewSetBlocksParams): OverviewSetBlock[] {
  return sets
    .filter((set) => !!set.horizontalPosition)
    .map((set) => ({
      id: set.id,
      leftPercent: offsetToPercent(set.horizontalPosition!.left, totalWidth),
      widthPercent: offsetToPercent(set.horizontalPosition!.width, totalWidth),
    }));
}

export interface OverviewDayBoundary {
  date: string;
  leftPercent: number;
}

interface CalculateDayBoundariesParams {
  days: Array<{ date: string }>;
  timezone: string;
  dayStartHour: number;
  festivalStart: Date;
  totalWidth: number;
}

/**
 * Proportional position of each day's start (the festival's configured
 * day-start hour, or local midnight when unset), for the vertical boundary
 * lines drawn on the map. A day whose boundary falls outside the currently
 * rendered `[0, totalWidth]` range (e.g. every other day, when a `day`
 * filter has narrowed the strip to a single day) is dropped - the map only
 * ever shows what the strip already shows.
 */
export function calculateDayBoundaries({
  days,
  timezone,
  dayStartHour,
  festivalStart,
  totalWidth,
}: CalculateDayBoundariesParams): OverviewDayBoundary[] {
  if (totalWidth <= 0) return [];

  return days
    .map((day) => {
      const dayStart = festivalDayStart(day.date, timezone, dayStartHour);
      const offset = timeToOffset(dayStart, festivalStart);
      return {
        date: day.date,
        leftPercent: offsetToPercent(offset, totalWidth),
      };
    })
    .filter(
      (boundary) => boundary.leftPercent >= 0 && boundary.leftPercent <= 100,
    );
}

export interface OverviewViewport {
  leftPercent: number;
  widthPercent: number;
}

interface CalculateOverviewViewportParams {
  scrollLeft: number;
  clientWidth: number;
  totalWidth: number;
}

/**
 * Proportional position/width of the strip's currently visible span, driven
 * by the scroll container's own `scrollLeft`/`clientWidth` (read-only input
 * here - this module never writes to the DOM).
 */
export function calculateOverviewViewport({
  scrollLeft,
  clientWidth,
  totalWidth,
}: CalculateOverviewViewportParams): OverviewViewport {
  if (totalWidth <= 0) return { leftPercent: 0, widthPercent: 100 };

  return {
    leftPercent: offsetToPercent(scrollLeft, totalWidth),
    widthPercent: Math.min(offsetToPercent(clientWidth, totalWidth), 100),
  };
}

interface FractionToOffsetParams {
  fraction: number;
  totalWidth: number;
}

/**
 * Converts a click/drag position on the map - expressed as a fraction of the
 * map's own rendered pixel width (0..1, already clamped by the caller from a
 * `getBoundingClientRect()` measurement) - into a timeline offset, using the
 * same `totalWidth` scale as everything else.
 */
export function fractionToOffset({
  fraction,
  totalWidth,
}: FractionToOffsetParams): number {
  const clamped = Math.max(0, Math.min(1, fraction));
  return clamped * totalWidth;
}
