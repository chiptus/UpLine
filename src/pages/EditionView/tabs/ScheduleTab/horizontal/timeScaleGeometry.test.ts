import { describe, expect, it } from "vitest";
import { PX_PER_MINUTE } from "@/lib/timelineCalculator";
import {
  computeDateChanges,
  computeDateLabelGeometry,
  DATE_LABEL_WIDTH_PX,
  DAY_GAP_PX,
  UPCOMING_FADE_THRESHOLD_PX,
} from "./timeScaleGeometry";

const timezone = "UTC";
const ONE_DAY_PX = 24 * 60 * PX_PER_MINUTE;

describe("computeDateChanges", () => {
  it("returns a single entry at position 0 for a single-day slot list", () => {
    const timeSlots = [
      new Date("2024-07-01T10:00:00Z"),
      new Date("2024-07-01T11:00:00Z"),
      new Date("2024-07-01T12:00:00Z"),
    ];

    const changes = computeDateChanges(timeSlots, timezone);

    expect(changes).toEqual([{ date: timeSlots[0], position: 0 }]);
  });

  it("adds an entry when the date (in the given timezone) changes", () => {
    const timeSlots = [
      new Date("2024-07-01T22:00:00Z"),
      new Date("2024-07-01T23:00:00Z"),
      new Date("2024-07-02T00:00:00Z"),
      new Date("2024-07-02T01:00:00Z"),
    ];

    const changes = computeDateChanges(timeSlots, timezone);

    expect(changes).toHaveLength(2);
    expect(changes[0]).toEqual({ date: timeSlots[0], position: 0 });
    expect(changes[1].date).toBe(timeSlots[2]);
    expect(changes[1].position).toBeGreaterThan(0);
  });

  it("returns an empty array for an empty slot list", () => {
    expect(computeDateChanges([], timezone)).toEqual([]);
  });

  it("respects the given timezone when detecting the day boundary", () => {
    // 21:30 UTC on 07-01 is already 07-02 in a UTC+2 (Berlin summer) zone.
    const timeSlots = [
      new Date("2024-07-01T21:00:00Z"),
      new Date("2024-07-01T22:00:00Z"),
    ];

    const changesUtc = computeDateChanges(timeSlots, "UTC");
    expect(changesUtc).toHaveLength(1);

    const changesBerlinSummer = computeDateChanges(timeSlots, "Europe/Berlin");
    expect(changesBerlinSummer).toHaveLength(2);
  });
});

describe("computeDateLabelGeometry", () => {
  const dateChanges = [
    { date: new Date("2024-07-01T10:00:00Z"), position: 0 },
    { date: new Date("2024-07-02T10:00:00Z"), position: ONE_DAY_PX },
  ];
  const totalWidth = 2 * ONE_DAY_PX;

  it("pins the first day's label at the start when scroll is 0", () => {
    const geometry = computeDateLabelGeometry(dateChanges, 0, totalWidth);

    expect(geometry.currentDate).toEqual(dateChanges[0]);
    expect(geometry.currentDateStickyLeft).toBe(0);
    expect(geometry.currentDateOpacity).toBe(1);
    expect(geometry.shouldShowUpcoming).toBe(false);
  });

  it("keeps the pinned label clamped within its own day block while scrolling", () => {
    const scrollLeft = ONE_DAY_PX / 2;
    const geometry = computeDateLabelGeometry(
      dateChanges,
      scrollLeft,
      totalWidth,
    );

    expect(geometry.currentDate).toEqual(dateChanges[0]);
    expect(geometry.currentDateStickyLeft).toBe(scrollLeft);
  });

  it("clamps the sticky offset so the label never overruns the day's end", () => {
    // Scrolled almost to the next day boundary.
    const scrollLeft = ONE_DAY_PX - 10;
    const geometry = computeDateLabelGeometry(
      dateChanges,
      scrollLeft,
      totalWidth,
    );

    const currentDayWidth = ONE_DAY_PX - DAY_GAP_PX;
    const expectedStickyLeft = currentDayWidth - DATE_LABEL_WIDTH_PX;
    expect(geometry.currentDateStickyLeft).toBe(expectedStickyLeft);
  });

  it("switches to the next day once scrolled past its boundary", () => {
    const geometry = computeDateLabelGeometry(
      dateChanges,
      ONE_DAY_PX,
      totalWidth,
    );

    expect(geometry.currentDate).toEqual(dateChanges[1]);
    expect(geometry.nextDate).toBeNull();
  });

  it("fades in the next day's label within the fade threshold", () => {
    const distanceFromBoundary = UPCOMING_FADE_THRESHOLD_PX / 2;
    const scrollLeft = ONE_DAY_PX - distanceFromBoundary;
    const geometry = computeDateLabelGeometry(
      dateChanges,
      scrollLeft,
      totalWidth,
    );

    expect(geometry.shouldShowUpcoming).toBe(true);
    expect(geometry.nextDate).toEqual(dateChanges[1]);
    expect(geometry.nextDateOpacity).toBeCloseTo(1, 5);
  });

  it("does not show the upcoming label outside the fade threshold", () => {
    const scrollLeft = ONE_DAY_PX - UPCOMING_FADE_THRESHOLD_PX - 1;
    const geometry = computeDateLabelGeometry(
      dateChanges,
      scrollLeft,
      totalWidth,
    );

    expect(geometry.shouldShowUpcoming).toBe(false);
  });

  it("uses the total width as the current day's end when there is no next day", () => {
    const singleDayChanges = [dateChanges[0]];
    const geometry = computeDateLabelGeometry(
      singleDayChanges,
      100,
      totalWidth,
    );

    expect(geometry.nextDate).toBeNull();
    expect(geometry.currentDayEndPosition).toBe(totalWidth);
  });
});
