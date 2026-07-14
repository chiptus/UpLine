import { describe, expect, it } from "vitest";
import {
  calculateTimelineData,
  offsetToTime,
  timeToOffset,
} from "./timelineCalculator";
import type { ScheduleDay, ScheduleSet } from "@/hooks/useScheduleData";
import type { Stage } from "@/api/stages/types";

const PX_PER_MINUTE = 2;

function makeSet(overrides: Partial<ScheduleSet> = {}): ScheduleSet {
  return {
    id: "set-1",
    name: "Artist",
    artists: [],
    ...overrides,
  };
}

function makeStage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: "stage-1",
    name: "Main Stage",
    color: "#ff0000",
    stage_order: 0,
    ...overrides,
  } as unknown as Stage;
}

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

  it("round-trips through timeToOffset for negative offsets", () => {
    const origin = new Date("2024-07-01T12:00:00Z");
    const moment = new Date("2024-07-01T10:15:00Z");
    const offset = timeToOffset(moment, origin);
    expect(offset).toBeLessThan(0);
    expect(offsetToTime(offset, origin).getTime()).toBe(moment.getTime());
  });
});

describe("calculateTimelineData", () => {
  it("returns null when there are no schedule days", () => {
    expect(
      calculateTimelineData(new Date(), new Date(), [], []),
    ).toBeNull();
  });

  it("returns null when festival dates are missing", () => {
    const days: ScheduleDay[] = [
      { date: "2024-07-01", displayDate: "Jul 1", stages: [] },
    ];
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
    const days: ScheduleDay[] = [
      {
        date: "2024-07-01",
        displayDate: "Jul 1",
        stages: [
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
        ],
      },
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
    const days: ScheduleDay[] = [
      {
        date: "2024-07-01",
        displayDate: "Jul 1",
        stages: [
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
        ],
      },
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
    const days: ScheduleDay[] = [
      {
        date: "2024-07-01",
        displayDate: "Jul 1",
        stages: [
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
        ],
      },
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
    const days: ScheduleDay[] = [
      {
        date: "2024-07-01",
        displayDate: "Jul 1",
        stages: [
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
        ],
      },
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
