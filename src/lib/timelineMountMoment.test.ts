import { describe, expect, it } from "vitest";
import {
  isNowWithinFestivalWindow,
  resolveTimelineMountMoment,
  roundToNearestMinutes,
} from "./timelineMountMoment";

const TIMEZONE = "Europe/Lisbon"; // UTC+1 in July (WEST)
const FESTIVAL_START = new Date("2025-07-12T10:00:00Z");
const FESTIVAL_END = new Date("2025-07-14T23:00:00Z");
// Comfortably inside [FESTIVAL_START, FESTIVAL_END].
const NOW_INSIDE_WINDOW = new Date("2025-07-13T20:00:00Z");
// Before the festival window opens.
const NOW_BEFORE_WINDOW = new Date("2025-07-10T10:00:00Z");
// After the festival window closes.
const NOW_AFTER_WINDOW = new Date("2025-07-15T10:00:00Z");

describe("resolveTimelineMountMoment", () => {
  it("prefers scrollTo when present and valid", () => {
    const moment = resolveTimelineMountMoment({
      scrollTo: "2025-07-13T22:00:00.000Z",
      day: "2025-07-12",
      timezone: TIMEZONE,
      festivalStart: FESTIVAL_START,
      festivalEnd: FESTIVAL_END,
      now: NOW_INSIDE_WINDOW,
    });

    expect(moment.getTime()).toBe(
      new Date("2025-07-13T22:00:00.000Z").getTime(),
    );
  });

  it("falls back to the day filter's start when scrollTo is absent", () => {
    const moment = resolveTimelineMountMoment({
      scrollTo: undefined,
      day: "2025-07-13",
      timezone: TIMEZONE,
      festivalStart: FESTIVAL_START,
      festivalEnd: FESTIVAL_END,
      now: NOW_INSIDE_WINDOW,
    });

    // Midnight in Europe/Lisbon (UTC+1 in July) is 23:00 UTC the prior day.
    expect(moment.getTime()).toBe(
      new Date("2025-07-12T23:00:00.000Z").getTime(),
    );
  });

  it("falls back to the day filter's start when scrollTo is an invalid date string", () => {
    const moment = resolveTimelineMountMoment({
      scrollTo: "not-a-date",
      day: "2025-07-13",
      timezone: TIMEZONE,
      festivalStart: FESTIVAL_START,
      festivalEnd: FESTIVAL_END,
      now: NOW_INSIDE_WINDOW,
    });

    expect(moment.getTime()).toBe(
      new Date("2025-07-12T23:00:00.000Z").getTime(),
    );
  });

  it("falls back to now minus ~1h when day filter is 'all', scrollTo is absent, and now is inside the window", () => {
    const moment = resolveTimelineMountMoment({
      scrollTo: undefined,
      day: "all",
      timezone: TIMEZONE,
      festivalStart: FESTIVAL_START,
      festivalEnd: FESTIVAL_END,
      now: NOW_INSIDE_WINDOW,
    });

    expect(moment.getTime()).toBe(
      NOW_INSIDE_WINDOW.getTime() - 60 * 60 * 1000,
    );
  });

  it("falls back to festivalStart when now is before the festival window", () => {
    const moment = resolveTimelineMountMoment({
      scrollTo: undefined,
      day: "all",
      timezone: TIMEZONE,
      festivalStart: FESTIVAL_START,
      festivalEnd: FESTIVAL_END,
      now: NOW_BEFORE_WINDOW,
    });

    expect(moment.getTime()).toBe(FESTIVAL_START.getTime());
  });

  it("falls back to festivalStart when now is after the festival window", () => {
    const moment = resolveTimelineMountMoment({
      scrollTo: undefined,
      day: "all",
      timezone: TIMEZONE,
      festivalStart: FESTIVAL_START,
      festivalEnd: FESTIVAL_END,
      now: NOW_AFTER_WINDOW,
    });

    expect(moment.getTime()).toBe(FESTIVAL_START.getTime());
  });

  it("falls back to festivalStart when scrollTo is invalid, day is 'all', and now is outside the window", () => {
    const moment = resolveTimelineMountMoment({
      scrollTo: "garbage",
      day: "all",
      timezone: TIMEZONE,
      festivalStart: FESTIVAL_START,
      festivalEnd: FESTIVAL_END,
      now: NOW_AFTER_WINDOW,
    });

    expect(moment.getTime()).toBe(FESTIVAL_START.getTime());
  });

  it("scrollTo takes precedence over an active day filter", () => {
    const moment = resolveTimelineMountMoment({
      scrollTo: "2025-07-14T12:00:00.000Z",
      day: "2025-07-13",
      timezone: TIMEZONE,
      festivalStart: FESTIVAL_START,
      festivalEnd: FESTIVAL_END,
      now: NOW_INSIDE_WINDOW,
    });

    expect(moment.getTime()).toBe(
      new Date("2025-07-14T12:00:00.000Z").getTime(),
    );
  });

  it("the day filter takes precedence over the now rule", () => {
    const moment = resolveTimelineMountMoment({
      scrollTo: undefined,
      day: "2025-07-13",
      timezone: TIMEZONE,
      festivalStart: FESTIVAL_START,
      festivalEnd: FESTIVAL_END,
      now: NOW_INSIDE_WINDOW,
    });

    expect(moment.getTime()).toBe(
      new Date("2025-07-12T23:00:00.000Z").getTime(),
    );
  });
});

describe("isNowWithinFestivalWindow", () => {
  it("is true strictly inside the window", () => {
    expect(
      isNowWithinFestivalWindow(NOW_INSIDE_WINDOW, FESTIVAL_START, FESTIVAL_END),
    ).toBe(true);
  });

  it("is true exactly at the window's start (inclusive)", () => {
    expect(
      isNowWithinFestivalWindow(FESTIVAL_START, FESTIVAL_START, FESTIVAL_END),
    ).toBe(true);
  });

  it("is true exactly at the window's end (inclusive)", () => {
    expect(
      isNowWithinFestivalWindow(FESTIVAL_END, FESTIVAL_START, FESTIVAL_END),
    ).toBe(true);
  });

  it("is false before the window opens", () => {
    expect(
      isNowWithinFestivalWindow(NOW_BEFORE_WINDOW, FESTIVAL_START, FESTIVAL_END),
    ).toBe(false);
  });

  it("is false after the window closes", () => {
    expect(
      isNowWithinFestivalWindow(NOW_AFTER_WINDOW, FESTIVAL_START, FESTIVAL_END),
    ).toBe(false);
  });
});

describe("roundToNearestMinutes", () => {
  it("rounds down to the nearest 5 minutes", () => {
    const date = new Date("2025-07-12T10:02:00.000Z");
    expect(roundToNearestMinutes(date, 5).getTime()).toBe(
      new Date("2025-07-12T10:00:00.000Z").getTime(),
    );
  });

  it("rounds up to the nearest 5 minutes", () => {
    const date = new Date("2025-07-12T10:03:00.000Z");
    expect(roundToNearestMinutes(date, 5).getTime()).toBe(
      new Date("2025-07-12T10:05:00.000Z").getTime(),
    );
  });

  it("defaults to a 5-minute granularity", () => {
    const date = new Date("2025-07-12T10:07:00.000Z");
    expect(roundToNearestMinutes(date).getTime()).toBe(
      new Date("2025-07-12T10:05:00.000Z").getTime(),
    );
  });

  it("is a no-op for a moment already on the grid", () => {
    const date = new Date("2025-07-12T10:15:00.000Z");
    expect(roundToNearestMinutes(date, 5).getTime()).toBe(date.getTime());
  });
});
