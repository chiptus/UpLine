import { describe, expect, it } from "vitest";
import {
  calculateDayBoundaries,
  calculateOverviewSetBlocks,
  calculateOverviewViewport,
  fractionToOffset,
  offsetToPercent,
} from "./timelineOverviewGeometry";
import { offsetToTime, timeToOffset } from "./timelineCalculator";
import type { HorizontalTimelineSet } from "./timelineCalculator";

const TIMEZONE = "Europe/Lisbon"; // UTC+1 in July (WEST)

describe("offsetToPercent", () => {
  it("expresses an offset as a percentage of totalWidth", () => {
    expect(offsetToPercent(50, 200)).toBe(25);
  });

  it("returns 0 when totalWidth is zero or negative (no division by zero)", () => {
    expect(offsetToPercent(50, 0)).toBe(0);
    expect(offsetToPercent(50, -10)).toBe(0);
  });
});

describe("calculateOverviewSetBlocks", () => {
  it("converts each set's horizontalPosition to a left/width percentage", () => {
    const sets = [buildSet("set-1", 0, 100), buildSet("set-2", 100, 200)];

    expect(calculateOverviewSetBlocks({ sets, totalWidth: 400 })).toEqual([
      { id: "set-1", leftPercent: 0, widthPercent: 25 },
      { id: "set-2", leftPercent: 25, widthPercent: 50 },
    ]);
  });

  it("skips sets without a computed horizontalPosition", () => {
    const sets: HorizontalTimelineSet[] = [
      { id: "set-1", name: "set-1", artists: [], setType: null },
      buildSet("set-2", 0, 100),
    ];

    expect(calculateOverviewSetBlocks({ sets, totalWidth: 400 })).toEqual([
      { id: "set-2", leftPercent: 0, widthPercent: 25 },
    ]);
  });
});

describe("calculateDayBoundaries", () => {
  it("places a boundary at each day's local midnight, in range", () => {
    const festivalStart = new Date("2025-07-12T14:00:00Z");
    const days = [{ date: "2025-07-12" }, { date: "2025-07-13" }];

    // Day 2 midnight (Europe/Lisbon) is 2025-07-12T23:00:00Z, 9h after start.
    // PX_PER_MINUTE is 2, so offset = 9 * 60 * 2 = 1080.
    const totalWidth = 2000;
    const boundaries = calculateDayBoundaries({
      days,
      timezone: TIMEZONE,
      festivalStart,
      totalWidth,
    });

    expect(boundaries).toEqual([
      { date: "2025-07-13", leftPercent: offsetToPercent(1080, totalWidth) },
    ]);
  });

  it("drops boundaries outside the rendered [0, totalWidth] range", () => {
    const festivalStart = new Date("2025-07-12T14:00:00Z");
    const days = [{ date: "2025-07-01" }, { date: "2025-12-25" }];

    expect(
      calculateDayBoundaries({
        days,
        timezone: TIMEZONE,
        festivalStart,
        totalWidth: 2000,
      }),
    ).toEqual([]);
  });

  it("returns no boundaries when totalWidth is zero", () => {
    expect(
      calculateDayBoundaries({
        days: [{ date: "2025-07-12" }],
        timezone: TIMEZONE,
        festivalStart: new Date("2025-07-12T00:00:00Z"),
        totalWidth: 0,
      }),
    ).toEqual([]);
  });
});

describe("calculateOverviewViewport", () => {
  it("expresses the visible span as left/width percentages", () => {
    expect(
      calculateOverviewViewport({
        scrollLeft: 100,
        clientWidth: 200,
        totalWidth: 1000,
      }),
    ).toEqual({
      leftPercent: 10,
      widthPercent: 20,
    });
  });

  it("caps widthPercent at 100 when the viewport is wider than the map", () => {
    expect(
      calculateOverviewViewport({
        scrollLeft: 0,
        clientWidth: 1500,
        totalWidth: 1000,
      }),
    ).toEqual({
      leftPercent: 0,
      widthPercent: 100,
    });
  });

  it("falls back to a full-width viewport when totalWidth is zero", () => {
    expect(
      calculateOverviewViewport({
        scrollLeft: 0,
        clientWidth: 500,
        totalWidth: 0,
      }),
    ).toEqual({
      leftPercent: 0,
      widthPercent: 100,
    });
  });
});

describe("fractionToOffset", () => {
  it("scales a 0..1 fraction to the totalWidth", () => {
    expect(fractionToOffset({ fraction: 0.25, totalWidth: 400 })).toBe(100);
  });

  it("clamps fractions outside 0..1", () => {
    expect(fractionToOffset({ fraction: -0.5, totalWidth: 400 })).toBe(0);
    expect(fractionToOffset({ fraction: 1.5, totalWidth: 400 })).toBe(400);
  });
});

describe("the shared ruler", () => {
  // These functions are only useful together if they all agree on one
  // offset<->percent scale. Each function above is tested in isolation with
  // hand-picked numbers that already assume that's true; these tests instead
  // compose the functions and check they actually agree with each other.

  it("places a set starting exactly at a day boundary at the same leftPercent as that boundary", () => {
    const festivalStart = new Date("2025-07-12T14:00:00Z");
    const totalWidth = 2000;
    const days = [{ date: "2025-07-12" }, { date: "2025-07-13" }];

    // Day 2 midnight (Europe/Lisbon) is 2025-07-12T23:00:00Z, 9h after start.
    const day2Midnight = new Date("2025-07-12T23:00:00Z");
    const setStartOffset = timeToOffset(day2Midnight, festivalStart);
    const set = buildSet("headliner", setStartOffset, 100);

    const boundaries = calculateDayBoundaries({
      days,
      timezone: "Europe/Lisbon",
      festivalStart,
      totalWidth,
    });
    const [block] = calculateOverviewSetBlocks({ sets: [set], totalWidth });

    const day2Boundary = boundaries.find((b) => b.date === "2025-07-13");
    expect(day2Boundary).toBeDefined();
    expect(block.leftPercent).toBe(day2Boundary!.leftPercent);
  });

  it("round-trips a click fraction through offset/time and back to the same percent", () => {
    const festivalStart = new Date("2025-07-12T14:00:00Z");
    const totalWidth = 2000;
    const clickedPercent = 40;

    const clickedOffset = fractionToOffset({
      fraction: clickedPercent / 100,
      totalWidth,
    });
    const jumpTarget = offsetToTime(clickedOffset, festivalStart);
    const roundTrippedOffset = timeToOffset(jumpTarget, festivalStart);

    expect(offsetToPercent(roundTrippedOffset, totalWidth)).toBe(
      clickedPercent,
    );
  });
});

function buildSet(
  id: string,
  left: number,
  width: number,
): HorizontalTimelineSet {
  return {
    id,
    name: id,
    artists: [],
    setType: null,
    horizontalPosition: { left, width },
  };
}
