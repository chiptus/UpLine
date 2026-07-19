import { describe, expect, it } from "vitest";
import { getDayJumpMoment } from "./timelineDayJump";
import type { ScheduleDay } from "@/hooks/useScheduleData";

const TIMEZONE = "Europe/Lisbon"; // UTC+1 in July (WEST)

describe("getDayJumpMoment", () => {
  it("returns the earliest set start across all stages", () => {
    const day: ScheduleDay = {
      date: "2025-07-13",
      displayDate: "2025-07-13",
      stages: [
        {
          id: "stage-1",
          name: "Main Stage",
          stage_order: 0,
          sets: [
            {
              id: "set-1",
              name: "Set 1",
              artists: [],
              startTime: new Date("2025-07-13T18:00:00Z"),
            },
          ],
        },
        {
          id: "stage-2",
          name: "Second Stage",
          stage_order: 1,
          sets: [
            {
              id: "set-2",
              name: "Set 2",
              artists: [],
              startTime: new Date("2025-07-13T15:00:00Z"),
            },
          ],
        },
      ],
    };

    const moment = getDayJumpMoment(day, TIMEZONE);
    expect(moment.getTime()).toBe(new Date("2025-07-13T15:00:00Z").getTime());
  });

  it("ignores sets without a start time", () => {
    const day = buildDay("2025-07-13", [
      undefined,
      new Date("2025-07-13T20:00:00Z"),
    ]);

    const moment = getDayJumpMoment(day, TIMEZONE);
    expect(moment.getTime()).toBe(new Date("2025-07-13T20:00:00Z").getTime());
  });

  it("falls back to festival-timezone midnight when the day has no timed sets", () => {
    const day = buildDay("2025-07-13", []);

    const moment = getDayJumpMoment(day, TIMEZONE);
    // Midnight in Europe/Lisbon (UTC+1 in July) is 23:00 UTC the prior day.
    expect(moment.getTime()).toBe(new Date("2025-07-12T23:00:00Z").getTime());
  });
});

function buildDay(
  date: string,
  startTimes: (Date | undefined)[],
): ScheduleDay {
  return {
    date,
    displayDate: date,
    stages: [
      {
        id: "stage-1",
        name: "Main Stage",
        stage_order: 0,
        sets: startTimes.map((startTime, index) => ({
          id: `set-${index}`,
          name: `Set ${index}`,
          artists: [],
          startTime,
        })),
      },
    ],
  };
}
