import { describe, expect, it } from "vitest";
import { filterScheduleDays, type ScheduleFilterCriteria } from "./scheduleFilter";
import type { ScheduleDay, ScheduleSet } from "@/hooks/useScheduleData";

const TIMEZONE = "Europe/Lisbon";

describe("filterScheduleDays", () => {
  describe("day predicate", () => {
    it("keeps all days when day is 'all'", () => {
      const days = [
        makeDay({ date: "2024-07-15" }),
        makeDay({ date: "2024-07-16" }),
      ];

      const result = filterScheduleDays(days, baseCriteria(), TIMEZONE);

      expect(result.map((day) => day.date)).toEqual([
        "2024-07-15",
        "2024-07-16",
      ]);
      expect(result[0].stages).toHaveLength(1);
      expect(result[1].stages).toHaveLength(1);
    });

    it("keeps the matching day's stages and empties non-matching days", () => {
      const days = [
        makeDay({ date: "2024-07-15" }),
        makeDay({ date: "2024-07-16" }),
      ];

      const result = filterScheduleDays(
        days,
        baseCriteria({ day: "2024-07-15" }),
        TIMEZONE,
      );

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe("2024-07-15");
      expect(result[0].stages).toHaveLength(1);
      expect(result[1].date).toBe("2024-07-16");
      expect(result[1].stages).toEqual([]);
    });
  });

  describe("time-of-day predicate (festival timezone buckets)", () => {
    it("keeps sets in the morning bucket (6-12 festival hour)", () => {
      // 10:00 UTC is 11:00 in Lisbon (WEST, UTC+1 in July) - morning.
      const days = [
        makeDay({
          stages: [
            {
              id: "stage-1",
              name: "Main Stage",
              stage_order: 1,
              sets: [makeSet({ startTime: new Date("2024-07-15T10:00:00Z") })],
            },
          ],
        }),
      ];

      const result = filterScheduleDays(
        days,
        baseCriteria({ time: "morning" }),
        TIMEZONE,
      );

      expect(result[0].stages[0].sets).toHaveLength(1);
    });

    it("drops sets outside the requested bucket", () => {
      // 22:00 UTC is 23:00 in Lisbon in July - evening, not morning.
      const days = [
        makeDay({
          stages: [
            {
              id: "stage-1",
              name: "Main Stage",
              stage_order: 1,
              sets: [makeSet({ startTime: new Date("2024-07-15T22:00:00Z") })],
            },
          ],
        }),
      ];

      const result = filterScheduleDays(
        days,
        baseCriteria({ time: "morning" }),
        TIMEZONE,
      );

      expect(result[0].stages[0].sets).toHaveLength(0);
    });

    it("computes buckets in the festival timezone, not UTC", () => {
      // 23:30 UTC on Jul 15 is 00:30 on Jul 16 in Lisbon (WEST, UTC+1) - morning-adjacent
      // "night" hour 0, which is neither morning, afternoon nor evening.
      const days = [
        makeDay({
          stages: [
            {
              id: "stage-1",
              name: "Main Stage",
              stage_order: 1,
              sets: [makeSet({ startTime: new Date("2024-07-15T23:30:00Z") })],
            },
          ],
        }),
      ];

      const morning = filterScheduleDays(
        days,
        baseCriteria({ time: "morning" }),
        TIMEZONE,
      );
      const evening = filterScheduleDays(
        days,
        baseCriteria({ time: "evening" }),
        TIMEZONE,
      );

      expect(morning[0].stages[0].sets).toHaveLength(0);
      expect(evening[0].stages[0].sets).toHaveLength(0);
    });

    it("passes sets without a startTime through unfiltered", () => {
      const days = [
        makeDay({
          stages: [
            {
              id: "stage-1",
              name: "Main Stage",
              stage_order: 1,
              sets: [makeSet({ startTime: undefined })],
            },
          ],
        }),
      ];

      const result = filterScheduleDays(
        days,
        baseCriteria({ time: "evening" }),
        TIMEZONE,
      );

      expect(result[0].stages[0].sets).toHaveLength(1);
    });

    it("keeps all sets when time is 'all'", () => {
      const days = [makeDay()];

      const result = filterScheduleDays(days, baseCriteria(), TIMEZONE);

      expect(result[0].stages[0].sets).toHaveLength(1);
    });
  });

  describe("stage predicate", () => {
    it("keeps all stages when the selection is empty", () => {
      const days = [
        makeDay({
          stages: [
            { id: "stage-1", name: "Main Stage", stage_order: 1, sets: [] },
            { id: "stage-2", name: "Second Stage", stage_order: 2, sets: [] },
          ],
        }),
      ];

      const result = filterScheduleDays(days, baseCriteria(), TIMEZONE);

      expect(result[0].stages.map((s) => s.id)).toEqual([
        "stage-1",
        "stage-2",
      ]);
    });

    it("matches stages by id, dropping unselected stages", () => {
      const days = [
        makeDay({
          stages: [
            { id: "stage-1", name: "Main Stage", stage_order: 1, sets: [] },
            { id: "stage-2", name: "Second Stage", stage_order: 2, sets: [] },
          ],
        }),
      ];

      const result = filterScheduleDays(
        days,
        baseCriteria({ stages: ["stage-2"] }),
        TIMEZONE,
      );

      expect(result[0].stages.map((s) => s.id)).toEqual(["stage-2"]);
    });
  });

  describe("combinations", () => {
    it("applies day, time and stage predicates together", () => {
      const days = [
        makeDay({
          date: "2024-07-15",
          stages: [
            {
              id: "stage-1",
              name: "Main Stage",
              stage_order: 1,
              sets: [
                makeSet({
                  id: "morning-set",
                  startTime: new Date("2024-07-15T10:00:00Z"),
                }),
                makeSet({
                  id: "evening-set",
                  startTime: new Date("2024-07-15T22:00:00Z"),
                }),
              ],
            },
            {
              id: "stage-2",
              name: "Second Stage",
              stage_order: 2,
              sets: [
                makeSet({
                  id: "other-stage-morning-set",
                  startTime: new Date("2024-07-15T10:00:00Z"),
                }),
              ],
            },
          ],
        }),
        makeDay({ date: "2024-07-16" }),
      ];

      const result = filterScheduleDays(
        days,
        baseCriteria({
          day: "2024-07-15",
          time: "morning",
          stages: ["stage-1"],
        }),
        TIMEZONE,
      );

      expect(result).toHaveLength(2);
      expect(result[0].stages).toHaveLength(1);
      expect(result[0].stages[0].id).toBe("stage-1");
      expect(result[0].stages[0].sets.map((s) => s.id)).toEqual([
        "morning-set",
      ]);
      expect(result[1].stages).toEqual([]);
    });

    it("does not mutate the input", () => {
      const days = [makeDay()];
      const snapshot = JSON.parse(JSON.stringify(days));

      filterScheduleDays(
        days,
        baseCriteria({ day: "2024-07-16", time: "morning", stages: ["x"] }),
        TIMEZONE,
      );

      expect(JSON.parse(JSON.stringify(days))).toEqual(snapshot);
    });
  });
});

function makeSet(overrides: Partial<ScheduleSet> = {}): ScheduleSet {
  return {
    id: "set-1",
    name: "A set",
    artists: [],
    startTime: new Date("2024-07-15T10:00:00Z"),
    ...overrides,
  };
}

function makeDay(overrides: Partial<ScheduleDay> = {}): ScheduleDay {
  return {
    date: "2024-07-15",
    displayDate: "Monday, Jul 15",
    stages: [
      {
        id: "stage-1",
        name: "Main Stage",
        stage_order: 1,
        sets: [makeSet()],
      },
    ],
    ...overrides,
  };
}

function baseCriteria(
  overrides: Partial<ScheduleFilterCriteria> = {},
): ScheduleFilterCriteria {
  return {
    day: "all",
    time: "all",
    stages: [],
    ...overrides,
  };
}
