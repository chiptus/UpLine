import { describe, expect, it } from "vitest";
import {
  resolveTimelineMountMoment,
  roundToNearestMinutes,
} from "./timelineMountMoment";

const TIMEZONE = "Europe/Lisbon"; // UTC+1 in July (WEST)
const FESTIVAL_START = new Date("2025-07-12T10:00:00Z");

describe("resolveTimelineMountMoment", () => {
  it("prefers scrollTo when present and valid", () => {
    const moment = resolveTimelineMountMoment({
      scrollTo: "2025-07-13T22:00:00.000Z",
      day: "2025-07-12",
      timezone: TIMEZONE,
      festivalStart: FESTIVAL_START,
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
    });

    expect(moment.getTime()).toBe(
      new Date("2025-07-12T23:00:00.000Z").getTime(),
    );
  });

  it("falls back to festivalStart when day filter is 'all' and scrollTo is absent", () => {
    const moment = resolveTimelineMountMoment({
      scrollTo: undefined,
      day: "all",
      timezone: TIMEZONE,
      festivalStart: FESTIVAL_START,
    });

    expect(moment.getTime()).toBe(FESTIVAL_START.getTime());
  });

  it("falls back to festivalStart when scrollTo is invalid and day is 'all'", () => {
    const moment = resolveTimelineMountMoment({
      scrollTo: "garbage",
      day: "all",
      timezone: TIMEZONE,
      festivalStart: FESTIVAL_START,
    });

    expect(moment.getTime()).toBe(FESTIVAL_START.getTime());
  });

  it("scrollTo takes precedence over an active day filter", () => {
    const moment = resolveTimelineMountMoment({
      scrollTo: "2025-07-14T12:00:00.000Z",
      day: "2025-07-13",
      timezone: TIMEZONE,
      festivalStart: FESTIVAL_START,
    });

    expect(moment.getTime()).toBe(
      new Date("2025-07-14T12:00:00.000Z").getTime(),
    );
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
