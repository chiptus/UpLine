import { describe, expect, it } from "vitest";
import { formatSetSchedule, isTimeSlotTba } from "./setScheduleDisplay";

const timedSet = {
  time_start: "2026-07-11T20:00:00Z",
  time_end: "2026-07-11T22:00:00Z",
  status: "confirmed" as const,
};

const tbaSet = {
  time_start: "2026-07-11T00:00:00Z",
  time_end: null,
  status: "tba" as const,
};

const dateless = {
  time_start: null,
  time_end: null,
  status: "tba" as const,
};

describe("formatSetSchedule", () => {
  it("shows the exact time range at full reveal for a timed set", () => {
    const result = formatSetSchedule(
      timedSet,
      { canShowDay: true, canShowTime: true },
      true,
      "UTC",
    );
    expect(result).toContain("20:00");
  });

  it("shows day-only for a timed set below full reveal", () => {
    const result = formatSetSchedule(
      timedSet,
      { canShowDay: true, canShowTime: false },
      true,
      "UTC",
    );
    expect(result).not.toContain("20:00");
    expect(result).not.toContain("TBA");
  });

  it("shows nothing when day isn't revealed", () => {
    expect(
      formatSetSchedule(
        timedSet,
        { canShowDay: false, canShowTime: false },
        true,
        "UTC",
      ),
    ).toBeNull();
  });

  it("shows day + TBA at full reveal for a TBA set, never the midnight placeholder time", () => {
    const result = formatSetSchedule(
      tbaSet,
      { canShowDay: true, canShowTime: true },
      true,
      "UTC",
    );
    expect(result).toContain("TBA");
    expect(result).not.toContain("00:00");
  });

  it("shows day + TBA below full reveal too, for a TBA set", () => {
    const result = formatSetSchedule(
      tbaSet,
      { canShowDay: true, canShowTime: false },
      true,
      "UTC",
    );
    expect(result).toContain("TBA");
  });

  it("shows nothing for a TBA set when day isn't revealed", () => {
    expect(
      formatSetSchedule(
        tbaSet,
        { canShowDay: false, canShowTime: false },
        true,
        "UTC",
      ),
    ).toBeNull();
  });

  it('shows "Time TBA" for a dateless TBA set, once day-level reveal is on', () => {
    expect(
      formatSetSchedule(
        dateless,
        { canShowDay: true, canShowTime: true },
        true,
        "UTC",
      ),
    ).toBe("Time TBA");
  });

  it("shows nothing for a dateless TBA set when day isn't revealed", () => {
    expect(
      formatSetSchedule(
        dateless,
        { canShowDay: false, canShowTime: false },
        true,
        "UTC",
      ),
    ).toBeNull();
  });
});

describe("isTimeSlotTba", () => {
  it("is true when every set in the slot is TBA", () => {
    expect(isTimeSlotTba([{ timeTba: true }, { timeTba: true }])).toBe(true);
  });

  it("is false when the slot mixes a TBA set with a real one (e.g. a 00:00 start)", () => {
    expect(isTimeSlotTba([{ timeTba: true }, { timeTba: false }])).toBe(false);
  });

  it("is false when no set in the slot is TBA", () => {
    expect(isTimeSlotTba([{ timeTba: false }])).toBe(false);
  });

  it("is false for an empty slot", () => {
    expect(isTimeSlotTba([])).toBe(false);
  });
});
