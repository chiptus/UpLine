import { describe, expect, it } from "vitest";
import { daysUntilStart } from "./festivalCountdown";

describe("daysUntilStart", () => {
  it("returns null when there is no start date", () => {
    expect(daysUntilStart(null, new Date("2026-01-01T00:00:00Z"))).toBeNull();
  });

  it("returns null for an unparseable start date", () => {
    expect(
      daysUntilStart("not-a-date", new Date("2026-01-01T00:00:00Z")),
    ).toBeNull();
  });

  it("counts whole calendar days until a future start date", () => {
    expect(
      daysUntilStart("2026-01-10", new Date("2026-01-01T23:00:00Z")),
    ).toBe(9);
  });

  it("returns 0 on the start date itself", () => {
    expect(
      daysUntilStart("2026-01-01", new Date("2026-01-01T12:00:00Z")),
    ).toBe(0);
  });

  it("returns a negative number once the start date has passed", () => {
    expect(
      daysUntilStart("2026-01-01", new Date("2026-01-05T00:00:00Z")),
    ).toBe(-4);
  });
});
