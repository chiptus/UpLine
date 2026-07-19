import { describe, expect, it } from "vitest";
import {
  calculateDayBoundaries,
  calculateOverviewSetBlocks,
  calculateOverviewViewport,
  fractionToOffset,
  offsetToPercent,
} from "./timelineOverviewGeometry";
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

    expect(calculateOverviewSetBlocks(sets, 400)).toEqual([
      { id: "set-1", leftPercent: 0, widthPercent: 25 },
      { id: "set-2", leftPercent: 25, widthPercent: 50 },
    ]);
  });

  it("skips sets without a computed horizontalPosition", () => {
    const sets: HorizontalTimelineSet[] = [
      { id: "set-1", name: "set-1", artists: [] },
      buildSet("set-2", 0, 100),
    ];

    expect(calculateOverviewSetBlocks(sets, 400)).toEqual([
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
    const boundaries = calculateDayBoundaries(
      days,
      TIMEZONE,
      festivalStart,
      totalWidth,
    );

    expect(boundaries).toEqual([
      { date: "2025-07-13", leftPercent: offsetToPercent(1080, totalWidth) },
    ]);
  });

  it("drops boundaries outside the rendered [0, totalWidth] range", () => {
    const festivalStart = new Date("2025-07-12T14:00:00Z");
    const days = [{ date: "2025-07-01" }, { date: "2025-12-25" }];

    expect(calculateDayBoundaries(days, TIMEZONE, festivalStart, 2000)).toEqual(
      [],
    );
  });

  it("returns no boundaries when totalWidth is zero", () => {
    expect(
      calculateDayBoundaries(
        [{ date: "2025-07-12" }],
        TIMEZONE,
        new Date("2025-07-12T00:00:00Z"),
        0,
      ),
    ).toEqual([]);
  });
});

describe("calculateOverviewViewport", () => {
  it("expresses the visible span as left/width percentages", () => {
    expect(calculateOverviewViewport(100, 200, 1000)).toEqual({
      leftPercent: 10,
      widthPercent: 20,
    });
  });

  it("caps widthPercent at 100 when the viewport is wider than the map", () => {
    expect(calculateOverviewViewport(0, 1500, 1000)).toEqual({
      leftPercent: 0,
      widthPercent: 100,
    });
  });

  it("falls back to a full-width viewport when totalWidth is zero", () => {
    expect(calculateOverviewViewport(0, 500, 0)).toEqual({
      leftPercent: 0,
      widthPercent: 100,
    });
  });
});

describe("fractionToOffset", () => {
  it("scales a 0..1 fraction to the totalWidth", () => {
    expect(fractionToOffset(0.25, 400)).toBe(100);
  });

  it("clamps fractions outside 0..1", () => {
    expect(fractionToOffset(-0.5, 400)).toBe(0);
    expect(fractionToOffset(1.5, 400)).toBe(400);
  });
});

function buildSet(id: string, left: number, width: number): HorizontalTimelineSet {
  return {
    id,
    name: id,
    artists: [],
    horizontalPosition: { left, width },
  };
}
