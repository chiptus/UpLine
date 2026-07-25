import { describe, expect, it } from "vitest";
import { groupTimeSlotsByFestivalDay } from "./scheduleDayGrouping";

const TZ = "Europe/Lisbon";

describe("groupTimeSlotsByFestivalDay", () => {
  it("groups slots on the same festival day together", () => {
    const slots = [
      { time: new Date("2026-07-10T18:00:00Z") },
      { time: new Date("2026-07-10T20:00:00Z") },
    ];

    const groups = groupTimeSlotsByFestivalDay(slots, TZ);

    expect(groups).toHaveLength(1);
    expect(groups[0].dayKey).toBe("2026-07-10");
    expect(groups[0].slots).toHaveLength(2);
  });

  it("splits slots across a day boundary", () => {
    const slots = [
      { time: new Date("2026-07-10T22:00:00Z") },
      { time: new Date("2026-07-11T22:00:00Z") },
    ];

    const groups = groupTimeSlotsByFestivalDay(slots, TZ);

    expect(groups.map((g) => g.dayKey)).toEqual(["2026-07-10", "2026-07-11"]);
  });

  it("groups a post-midnight set under the festival's calendar day, not the next", () => {
    // 00:30 Lisbon time on July 11 — still "night of July 10" in spirit,
    // but the festival day-key boundary is midnight, so it groups as Jul 11.
    const slots = [
      { time: new Date("2026-07-10T20:00:00Z") }, // 21:00 Lisbon (Jul 10)
      { time: new Date("2026-07-10T23:30:00Z") }, // 00:30 Lisbon (Jul 11)
    ];

    const groups = groupTimeSlotsByFestivalDay(slots, TZ);

    expect(groups.map((g) => g.dayKey)).toEqual(["2026-07-10", "2026-07-11"]);
    expect(groups[1].slots).toHaveLength(1);
  });

  it("returns an empty array for no slots", () => {
    expect(groupTimeSlotsByFestivalDay([], TZ)).toEqual([]);
  });
});
