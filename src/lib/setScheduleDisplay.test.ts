import { describe, expect, it } from "vitest";
import { formatSetSchedule } from "./setScheduleDisplay";

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
    const result = formatSetSchedule(timedSet, "full", true, "UTC");
    expect(result).toContain("20:00");
  });

  it("shows day-only for a timed set below full reveal", () => {
    const result = formatSetSchedule(timedSet, "days", true, "UTC");
    expect(result).not.toContain("20:00");
    expect(result).not.toContain("TBA");
  });

  it("shows nothing when day isn't revealed", () => {
    expect(formatSetSchedule(timedSet, "draft", true, "UTC")).toBeNull();
  });

  it("shows day + TBA at full reveal for a TBA set, never the midnight placeholder time", () => {
    const result = formatSetSchedule(tbaSet, "full", true, "UTC");
    expect(result).toContain("TBA");
    expect(result).not.toContain("00:00");
  });

  it("shows day + TBA below full reveal too, for a TBA set", () => {
    const result = formatSetSchedule(tbaSet, "days", true, "UTC");
    expect(result).toContain("TBA");
    expect(result).not.toContain("00:00");
  });

  it("shows nothing for a TBA set when day isn't revealed", () => {
    expect(formatSetSchedule(tbaSet, "draft", true, "UTC")).toBeNull();
  });

  it('shows "Time TBA" for a dateless TBA set, once day-level reveal is on', () => {
    expect(formatSetSchedule(dateless, "full", true, "UTC")).toBe("Time TBA");
  });

  it("shows nothing for a dateless TBA set when day isn't revealed", () => {
    expect(formatSetSchedule(dateless, "draft", true, "UTC")).toBeNull();
  });
});
