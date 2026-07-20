import { describe, expect, it } from "vitest";
import {
  calculateScheduleWindow,
  calculateTimelineData,
  offsetToTime,
  timeToOffset,
} from "./timelineCalculator";
import type { ScheduleDay, ScheduleSet } from "@/hooks/useScheduleData";
import { makeScheduleDay, makeStage } from "@/__tests__/fixtures";

const PX_PER_MINUTE = 2;

describe("timeToOffset", () => {
  it("returns 0 when moment equals origin", () => {
    const origin = new Date("2024-07-01T10:00:00Z");
    expect(timeToOffset(origin, origin)).toBe(0);
  });

  it("converts minutes after origin at 2px per minute", () => {
    const origin = new Date("2024-07-01T10:00:00Z");
    const moment = new Date("2024-07-01T11:00:00Z"); // +60 minutes
    expect(timeToOffset(moment, origin)).toBe(60 * PX_PER_MINUTE);
  });

  it("returns a negative offset when moment is before origin", () => {
    const origin = new Date("2024-07-01T10:00:00Z");
    const moment = new Date("2024-07-01T09:30:00Z"); // -30 minutes
    expect(timeToOffset(moment, origin)).toBe(-30 * PX_PER_MINUTE);
  });

  it("matches the legacy hour-scale constant (120px per hour)", () => {
    const origin = new Date("2024-07-01T00:00:00Z");
    const moment = new Date("2024-07-01T03:00:00Z"); // 3 hours
    expect(timeToOffset(moment, origin)).toBe(3 * 120);
  });
});

describe("offsetToTime", () => {
  it("returns the origin when offset is 0", () => {
    const origin = new Date("2024-07-01T10:00:00Z");
    expect(offsetToTime(0, origin).getTime()).toBe(origin.getTime());
  });

  it("converts a pixel offset back into minutes after origin", () => {
    const origin = new Date("2024-07-01T10:00:00Z");
    const offset = 60 * PX_PER_MINUTE; // 60 minutes
    const result = offsetToTime(offset, origin);
    expect(result.getTime()).toBe(
      origin.getTime() + 60 * 60 * 1000,
    );
  });

  it("is the inverse of timeToOffset for whole-minute moments", () => {
    const origin = new Date("2024-07-01T08:00:00Z");
    const moment = new Date("2024-07-01T10:37:00Z");
    const offset = timeToOffset(moment, origin);
    expect(offsetToTime(offset, origin).getTime()).toBe(moment.getTime());
  });

  it("is the inverse of timeToOffset for sub-minute moments", () => {
    const origin = new Date("2024-07-01T08:00:00Z");
    const moment = new Date("2024-07-01T10:37:42.500Z");
    const offset = timeToOffset(moment, origin);
    expect(offsetToTime(offset, origin).getTime()).toBe(moment.getTime());
  });

  it("round-trips through timeToOffset for negative offsets", () => {
    const origin = new Date("2024-07-01T12:00:00Z");
    const moment = new Date("2024-07-01T10:15:00Z");
    const offset = timeToOffset(moment, origin);
    expect(offset).toBeLessThan(0);
    expect(offsetToTime(offset, origin).getTime()).toBe(moment.getTime());
  });
});

describe("calculateScheduleWindow", () => {
  it("spans the earliest set start (hour-floored) to the latest set end (hour-ceiled) across all days and stages", () => {
    const window = calculateScheduleWindow(makeDays());

    expect(window).not.toBeNull();
    expect(window!.start.getTime()).toBe(
      new Date("2024-07-01T10:00:00Z").getTime(),
    );
    expect(window!.end.getTime()).toBe(
      new Date("2024-07-02T21:59:59.999Z").getTime(),
    );
  });

  it("returns null when no set has a time", () => {
    const days: ScheduleDay[] = [
      {
        date: "2024-07-01",
        displayDate: "Jul 1",
        stages: [
          {
            id: "stage-1",
            name: "Main Stage",
            stage_order: 0,
            sets: [makeSet()],
          },
        ],
      },
    ];

    expect(calculateScheduleWindow(days)).toBeNull();
  });

  it("returns null for an empty schedule", () => {
    expect(calculateScheduleWindow([])).toBeNull();
  });

  it("is unaffected by filtering only when fed the full schedule (a filtered subset yields a narrower window)", () => {
    const allDays = makeDays();
    const fullWindow = calculateScheduleWindow(allDays);

    // Simulate a stage filter that keeps only stage-2's sets (day 1,
    // 12:00-13:00 only).
    const stageFilteredDays = allDays.map((day) => ({
      ...day,
      stages: day.stages.filter((stage) => stage.id === "stage-2"),
    }));
    const stageFilteredWindow = calculateScheduleWindow(stageFilteredDays);

    // The full window is what time-awareness must be gated on: the filtered
    // subset's window has shrunk on both ends.
    expect(fullWindow!.end.getTime()).toBe(
      new Date("2024-07-02T21:59:59.999Z").getTime(),
    );
    expect(stageFilteredWindow!.start.getTime()).toBeGreaterThan(
      fullWindow!.start.getTime(),
    );
    expect(stageFilteredWindow!.end.getTime()).toBeLessThan(
      fullWindow!.end.getTime(),
    );

    // Simulate a day filter that drops day 2 entirely.
    const dayFilteredDays = allDays.map((day) =>
      day.date === "2024-07-01" ? day : { ...day, stages: [] },
    );
    const dayFilteredWindow = calculateScheduleWindow(dayFilteredDays);
    expect(dayFilteredWindow!.end.getTime()).toBe(
      new Date("2024-07-01T13:59:59.999Z").getTime(),
    );
    expect(dayFilteredWindow!.end.getTime()).toBeLessThan(
      fullWindow!.end.getTime(),
    );
  });
});

describe("calculateTimelineData", () => {
  it("returns null when there are no schedule days", () => {
    expect(
      calculateTimelineData(new Date(), new Date(), [], []),
    ).toBeNull();
  });

  it("returns null when festival dates are missing", () => {
    const days = [makeScheduleDay("2024-07-01")];
    expect(
      calculateTimelineData(
        null as unknown as Date,
        null as unknown as Date,
        days,
        [],
      ),
    ).toBeNull();
  });

  it("rounds the earliest set time down to the top of the hour", () => {
    const stage = makeStage();
    const days = [
      makeScheduleDay("2024-07-01", [
        {
          id: stage.id,
          name: stage.name,
          stage_order: 0,
          sets: [
            makeSet({
              startTime: new Date("2024-07-01T10:37:00Z"),
              endTime: new Date("2024-07-01T11:37:00Z"),
            }),
          ],
        },
      ]),
    ];

    const data = calculateTimelineData(
      new Date("2024-07-01T00:00:00Z"),
      new Date("2024-07-02T00:00:00Z"),
      days,
      [stage],
    );

    expect(data).not.toBeNull();
    // Earliest set starts at 10:37 -> rounded down to 10:00
    expect(data!.festivalStart.getTime()).toBe(
      new Date("2024-07-01T10:00:00Z").getTime(),
    );
    // The set itself is offset from that rounded-down origin (37 minutes in)
    const set = data!.stages[0].sets[0];
    expect(set.horizontalPosition?.left).toBe(37 * PX_PER_MINUTE);
  });

  it("rounds the latest set time up to the end of the hour", () => {
    const stage = makeStage();
    const days = [
      makeScheduleDay("2024-07-01", [
        {
          id: stage.id,
          name: stage.name,
          stage_order: 0,
          sets: [
            makeSet({
              startTime: new Date("2024-07-01T10:00:00Z"),
              endTime: new Date("2024-07-01T11:15:00Z"),
            }),
          ],
        },
      ]),
    ];

    const data = calculateTimelineData(
      new Date("2024-07-01T00:00:00Z"),
      new Date("2024-07-02T00:00:00Z"),
      days,
      [stage],
    );

    expect(data).not.toBeNull();
    // Latest set ends at 11:15 -> rounded up to 11:59:59.999
    expect(data!.festivalEnd.getTime()).toBe(
      new Date("2024-07-01T11:59:59.999Z").getTime(),
    );
    // totalWidth spans the full rounded-up hour boundary (2 hours from 10:00 to 12:00)
    expect(data!.totalWidth).toBe(timeToOffset(
      new Date("2024-07-01T12:00:00Z"),
      new Date("2024-07-01T10:00:00Z"),
    ));
  });

  it("applies the 100px minimum width to short sets without affecting the scale", () => {
    const stage = makeStage();
    const days = [
      makeScheduleDay("2024-07-01", [
        {
          id: stage.id,
          name: stage.name,
          stage_order: 0,
          sets: [
            makeSet({
              id: "short-set",
              startTime: new Date("2024-07-01T10:00:00Z"),
              endTime: new Date("2024-07-01T10:10:00Z"), // 10 minutes -> 20px raw
            }),
            makeSet({
              id: "long-set",
              startTime: new Date("2024-07-01T11:00:00Z"),
              endTime: new Date("2024-07-01T12:00:00Z"), // 60 minutes -> 120px raw
            }),
          ],
        },
      ]),
    ];

    const data = calculateTimelineData(
      new Date("2024-07-01T00:00:00Z"),
      new Date("2024-07-02T00:00:00Z"),
      days,
      [stage],
    );

    const sets = data!.stages[0].sets;
    const shortSet = sets.find((s) => s.id === "short-set");
    const longSet = sets.find((s) => s.id === "long-set");

    expect(shortSet?.horizontalPosition?.width).toBe(100); // clamped to the minimum
    expect(longSet?.horizontalPosition?.width).toBe(60 * PX_PER_MINUTE); // scale-derived, not clamped
  });

  it("positions the last time slot at the total width (axis upper boundary)", () => {
    const stage = makeStage();
    const days = [
      makeScheduleDay("2024-07-01", [
        {
          id: stage.id,
          name: stage.name,
          stage_order: 0,
          sets: [
            makeSet({
              startTime: new Date("2024-07-01T10:00:00Z"),
              endTime: new Date("2024-07-01T11:00:00Z"),
            }),
          ],
        },
      ]),
    ];

    const data = calculateTimelineData(
      new Date("2024-07-01T00:00:00Z"),
      new Date("2024-07-02T00:00:00Z"),
      days,
      [stage],
    );

    const lastSlot = data!.timeSlots[data!.timeSlots.length - 1];
    expect(timeToOffset(lastSlot, data!.festivalStart)).toBe(
      data!.totalWidth,
    );
  });
});

function makeSet(overrides: Partial<ScheduleSet> = {}): ScheduleSet {
  return {
    id: "set-1",
    name: "Artist",
    artists: [],
    ...overrides,
  };
}

function makeDays(): ScheduleDay[] {
  return [
    makeScheduleDay("2024-07-01", [
      {
        id: "stage-1",
        name: "Main Stage",
        stage_order: 0,
        sets: [
          makeSet({
            id: "day1-main",
            startTime: new Date("2024-07-01T10:37:00Z"),
            endTime: new Date("2024-07-01T11:30:00Z"),
          }),
        ],
      },
      {
        id: "stage-2",
        name: "Club Stage",
        stage_order: 1,
        sets: [
          makeSet({
            id: "day1-club",
            startTime: new Date("2024-07-01T12:00:00Z"),
            endTime: new Date("2024-07-01T13:00:00Z"),
          }),
        ],
      },
    ]),
    makeScheduleDay("2024-07-02", [
      {
        id: "stage-1",
        name: "Main Stage",
        stage_order: 0,
        sets: [
          makeSet({
            id: "day2-main",
            startTime: new Date("2024-07-02T20:00:00Z"),
            endTime: new Date("2024-07-02T21:15:00Z"),
          }),
        ],
      },
    ]),
  ];
}

